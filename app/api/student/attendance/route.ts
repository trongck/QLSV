import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro, TrangThaiDiemDanh, TrangThaiBuoiHoc } from "@/types";

// ─── Tiết → giờ ──────────────────────────────────────────────────────────────

const TIET_TIME: Record<number, string> = {
  1: "07:00", 2: "07:50",  3: "08:40",  4: "09:30",  5: "10:20",
  6: "11:10", 7: "13:00",  8: "13:50",  9: "14:40", 10: "15:30",
  11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
};

function tietToTime(tiet: number): string {
  return TIET_TIME[tiet] ?? `${tiet}:00`;
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireStudent(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.SinhVien ? payload : null;
  } catch {
    return null;
  }
}

// ─── GET /api/student/attendance ─────────────────────────────────────────────
// Query params:
//   mahocky  - ID học kỳ (optional, default: học kỳ hiệu lực)
//   filter   - "month" | "semester" (optional, default: "semester")

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mahockyParam = searchParams.get("mahocky");

  const supabase = createClient(await cookies());

  // ── Lấy thông tin sinh viên ────────────────────────────────────────────────
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv, malop")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json(
      { error: "Không tìm thấy thông tin sinh viên." },
      { status: 404 }
    );
  }

  const { masv } = svData;

  // ── Lấy danh sách học kỳ ──────────────────────────────────────────────────
  const { data: dsHocKy } = await supabase
    .from("hocky")
    .select("mahocky, tenhocky, namhoc, ky, danghieuluc")
    .order("namhoc", { ascending: false })
    .order("ky", { ascending: false });

  const hocKyList = dsHocKy ?? [];

  let mahocky: number;
  if (mahockyParam) {
    mahocky = Number(mahockyParam);
  } else {
    const active = hocKyList.find((hk) => hk.danghieuluc);
    mahocky = active ? active.mahocky : (hocKyList[0]?.mahocky ?? 0);
  }

  const hocKyHienTai = hocKyList.find((hk) => hk.mahocky === mahocky) ?? null;

  // ── Lấy lịch sử điểm danh ─────────────────────────────────────────────────
  // diemdanh → buoihoc → lichhoc → phancong → monhoc
  const { data: rawDiemDanh, error: ddError } = await supabase
    .from("diemdanh")
    .select(`
      madiemdanh,
      trangthai,
      ghichu,
      thoigiandiemdanh,
      ngaytao,
      buoihoc:mabuoihoc (
        mabuoihoc,
        ngayhoc,
        trangthai,
        lichhoc:malichhoc (
          malichhoc,
          tietbatdau,
          tietketthuc,
          maphong,
          phancong:maphancong (
            maphancong,
            mahocky,
            mamon,
            monhoc:mamon ( tenmon ),
            giangvien:magv ( hoten )
          )
        )
      )
    `)
    .eq("masv", masv)
    .order("ngaytao", { ascending: false });

  if (ddError) {
    return NextResponse.json({ error: ddError.message }, { status: 500 });
  }

  // Lọc theo học kỳ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = (rawDiemDanh as any[]).filter((row) => {
    const pc = row.buoihoc?.lichhoc?.phancong;
    return pc?.mahocky === mahocky;
  });

  // Map sang history items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const history = filtered.map((row: any) => {
    const buoi = row.buoihoc;
    const lich = buoi?.lichhoc;
    const pc = lich?.phancong;
    const ngayhoc = new Date(buoi?.ngayhoc);

    return {
      madiemdanh: row.madiemdanh,
      mabuoihoc: buoi?.mabuoihoc,
      ngayhoc: buoi?.ngayhoc,
      day: String(ngayhoc.getDate()).padStart(2, "0"),
      month: `T${String(ngayhoc.getMonth() + 1).padStart(2, "0")}`,
      tenmon: pc?.monhoc?.tenmon ?? "Chưa có tên môn",
      giangvien: pc?.giangvien?.hoten ?? "Đang cập nhật",
      phonghoc: lich?.maphong ?? "---",
      gioVao: tietToTime(lich?.tietbatdau ?? 1),
      gioRa: tietToTime(lich?.tietketthuc ?? 1),
      thoigiandiemdanh: row.thoigiandiemdanh,
      trangthai: row.trangthai as TrangThaiDiemDanh,
      ghichu: row.ghichu,
    };
  });

  // ── Tính thống kê ─────────────────────────────────────────────────────────
  const total = history.length;
  const comat   = history.filter((r) => r.trangthai === TrangThaiDiemDanh.Comat).length;
  const vangmat  = history.filter((r) => r.trangthai === TrangThaiDiemDanh.Vangmat).length;
  const dimuon   = history.filter((r) => r.trangthai === TrangThaiDiemDanh.Dimuon).length;
  const cophep   = history.filter((r) => r.trangthai === TrangThaiDiemDanh.Cophep).length;
  const tilechuyencan =
    total > 0 ? Math.round(((comat + dimuon + cophep) / total) * 100) : 0;

  // ── Tìm buổi học đang mở điểm danh cho sinh viên này ────────────────────
  // Bước 1: Lấy tất cả malichhoc của các môn SV đang học trong học kỳ này
  const { data: svmonData } = await supabase
    .from("sinhvienmonhoc")
    .select(`
      maphancong,
      phancong:maphancong (
        mahocky,
        lichhoc ( malichhoc )
      )
    `)
    .eq("masv", masv)
    .eq("trangthai", "Danghoc");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lichHocIds = (svmonData as any[] ?? [])
    .filter((r) => r.phancong?.mahocky === mahocky)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .flatMap((r: any) => r.phancong?.lichhoc?.map((l: any) => l.malichhoc) ?? []);

  let currentSession = null;

  if (lichHocIds.length > 0) {
    // Bước 2: Tìm buoihoc đang mở điểm danh thuộc những lichhoc đó
    const { data: activeSession } = await supabase
      .from("buoihoc")
      .select(`
        mabuoihoc, ngayhoc, noidung,
        lichhoc:malichhoc (
          malichhoc, tietbatdau, tietketthuc, maphong,
          phancong:maphancong (
            maphancong, mamon,
            monhoc:mamon ( tenmon ),
            giangvien:magv ( hoten )
          )
        )
      `)
      .eq("trangthai", TrangThaiBuoiHoc.DangDiemdanh)
      .in("malichhoc", lichHocIds)
      .maybeSingle();

    if (activeSession) {
      // Bước 3: Kiểm tra sinh viên chưa điểm danh buổi này
      const { data: alreadyAttended } = await supabase
        .from("diemdanh")
        .select("madiemdanh")
        .eq("mabuoihoc", (activeSession as any).mabuoihoc)
        .eq("masv", masv)
        .maybeSingle();

      if (!alreadyAttended) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = activeSession as any;
        const lich = s.lichhoc;
        const pc = lich?.phancong;
        const ngayhoc = new Date(s.ngayhoc);

        currentSession = {
          mabuoihoc: s.mabuoihoc,
          ngayhoc: s.ngayhoc,
          day: String(ngayhoc.getDate()).padStart(2, "0"),
          month: `T${String(ngayhoc.getMonth() + 1).padStart(2, "0")}`,
          tenmon: pc?.monhoc?.tenmon ?? "---",
          giangvien: pc?.giangvien?.hoten ?? "---",
          phonghoc: lich?.maphong ?? "---",
          gioVao: tietToTime(lich?.tietbatdau ?? 1),
          gioRa: tietToTime(lich?.tietketthuc ?? 1),
          maphancong: pc?.maphancong,
        };
      }
    }
  }

  return NextResponse.json({
    hocKyList,
    mahocky,
    hocKy: hocKyHienTai,
    stats: { total, comat, vangmat, dimuon, cophep, tilechuyencan },
    currentSession,
    history,
  });
}

// ─── POST /api/student/attendance ────────────────────────────────────────────
// Body: { mabuoihoc: number, phuongthuc: "qr" | "face", qr_data?: string }

export async function POST(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { mabuoihoc: number; phuongthuc: "qr" | "face"; qr_data?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const { mabuoihoc, phuongthuc, qr_data } = body;

  if (!mabuoihoc || !phuongthuc) {
    return NextResponse.json(
      { error: "Thiếu thông tin điểm danh." },
      { status: 400 }
    );
  }

  // ── Xác minh mã QR ───────────────────────────────────────────────────────
  // QR code chứa: mabuoihoc (dạng chuỗi số)
  if (phuongthuc === "qr") {
    const decoded = qr_data?.trim();
    if (!decoded || String(mabuoihoc) !== decoded) {
      return NextResponse.json(
        { error: "Mã QR không hợp lệ hoặc không khớp với buổi học." },
        { status: 400 }
      );
    }
  }

  const supabase = createClient(await cookies());

  // ── Lấy thông tin sinh viên ────────────────────────────────────────────────
  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json(
      { error: "Không tìm thấy thông tin sinh viên." },
      { status: 404 }
    );
  }

  const { masv } = svData;

  // ── Kiểm tra buổi học tồn tại và đang mở ─────────────────────────────────
  const { data: buoiHoc, error: buoiError } = await supabase
    .from("buoihoc")
    .select(`
      mabuoihoc, ngayhoc, trangthai,
      lichhoc:malichhoc (
        malichhoc, tietbatdau, tietketthuc,
        phancong:maphancong (
          maphancong, mahocky, mamon,
          monhoc:mamon ( tenmon )
        )
      )
    `)
    .eq("mabuoihoc", mabuoihoc)
    .single();

  if (buoiError || !buoiHoc) {
    return NextResponse.json(
      { error: "Buổi học không tồn tại." },
      { status: 404 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bh = buoiHoc as any;

  if (bh.trangthai !== TrangThaiBuoiHoc.DangDiemdanh) {
    const msg =
      bh.trangthai === TrangThaiBuoiHoc.Hoanthanh
        ? "Buổi học đã kết thúc điểm danh."
        : "Buổi học chưa được mở điểm danh.";
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  const maphancong = bh.lichhoc?.phancong?.maphancong;

  // ── Kiểm tra sinh viên đã đăng ký môn học ────────────────────────────────
  const { data: enrolled } = await supabase
    .from("sinhvienmonhoc")
    .select("masv")
    .eq("masv", masv)
    .eq("maphancong", maphancong)
    .eq("trangthai", "Danghoc")
    .maybeSingle();

  if (!enrolled) {
    return NextResponse.json(
      { error: "Bạn không đăng ký môn học này." },
      { status: 403 }
    );
  }

  // ── Kiểm tra chưa điểm danh buổi này ─────────────────────────────────────
  const { data: existing } = await supabase
    .from("diemdanh")
    .select("madiemdanh, trangthai")
    .eq("mabuoihoc", mabuoihoc)
    .eq("masv", masv)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Bạn đã điểm danh buổi học này rồi.", existing },
      { status: 409 }
    );
  }

  // ── Xác định trạng thái: Đúng giờ hay Đi muộn (>10 phút) ────────────────
  const now = new Date();
  const tietBatDau = bh.lichhoc?.tietbatdau ?? 1;
  const gioVao = TIET_TIME[tietBatDau] ?? "07:00";
  const [startHour, startMin] = gioVao.split(":").map(Number);

  // Ghép ngày học với giờ tiết bắt đầu
  const sessionStart = new Date(bh.ngayhoc);
  sessionStart.setHours(startHour, startMin + 10, 0, 0); // +10 phút ân hạn

  const trangThaiDiemDanh =
    now > sessionStart
      ? TrangThaiDiemDanh.Dimuon
      : TrangThaiDiemDanh.Comat;

  // ── Ghi điểm danh ────────────────────────────────────────────────────────
  const { data: newDiemDanh, error: insertError } = await supabase
    .from("diemdanh")
    .insert({
      mabuoihoc,
      masv,
      trangthai: trangThaiDiemDanh,
      ghichu: `Điểm danh qua ${phuongthuc === "qr" ? "mã QR" : "nhận dạng khuôn mặt"}`,
      thoigiandiemdanh: now.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    diemdanh: newDiemDanh,
    trangthai: trangThaiDiemDanh,
    tenmon: bh.lichhoc?.phancong?.monhoc?.tenmon ?? "---",
    message:
      trangThaiDiemDanh === TrangThaiDiemDanh.Comat
        ? "Điểm danh thành công! Bạn đến đúng giờ."
        : "Điểm danh thành công! Tuy nhiên bạn đã đến muộn hơn 10 phút.",
  });
}
