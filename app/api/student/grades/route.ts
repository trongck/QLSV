import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

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

// ─── Quy đổi điểm 10 → điểm 4 & điểm chữ ────────────────────────────────────

function diem10ToDiem4(d: number): number {
  if (d >= 9.0) return 4.0;
  if (d >= 8.5) return 3.7;
  if (d >= 8.0) return 3.5;
  if (d >= 7.5) return 3.0;
  if (d >= 7.0) return 2.5;
  if (d >= 6.5) return 2.0;
  if (d >= 6.0) return 1.5;
  if (d >= 5.5) return 1.0;
  if (d >= 5.0) return 0.5;
  return 0.0;
}

function diem10ToDiemChu(d: number): string {
  if (d >= 9.0) return "A+";
  if (d >= 8.5) return "A";
  if (d >= 8.0) return "B+";
  if (d >= 7.5) return "B";
  if (d >= 7.0) return "C+";
  if (d >= 6.5) return "C";
  if (d >= 6.0) return "D+";
  if (d >= 5.5) return "D";
  if (d >= 5.0) return "D-";
  return "F";
}

// ─── GET /api/student/grades ──────────────────────────────────────────────────
// Query params:
//   mahocky - ID học kỳ (optional, default: học kỳ hiệu lực)

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
    .select("masv, malop, hoten")
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

  // ── Bước 1: Lấy TẤT CẢ môn sinh viên đã đăng ký trong học kỳ này ─────────
  // sinhvienmonhoc → phancong → monhoc (lọc theo mahocky)
  const { data: rawEnrolled, error: enrolledError } = await supabase
    .from("sinhvienmonhoc")
    .select(`
      maphancong,
      trangthai,
      phancong:maphancong (
        maphancong,
        mahocky,
        malophoc,
        mamon,
        monhoc:mamon ( tenmon, sotinchi ),
        giangvien:magv ( hodem, ten )
      )
    `)
    .eq("masv", masv)
    .in("trangthai", ["Danghoc", "Hoan"]);

  if (enrolledError) {
    return NextResponse.json({ error: enrolledError.message }, { status: 500 });
  }

  // Lọc theo học kỳ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrolled = (rawEnrolled as any[]).filter(
    (r) => r.phancong?.mahocky === mahocky
  );

  if (enrolled.length === 0) {
    return NextResponse.json({
      hocKyList,
      mahocky,
      hocKy: hocKyHienTai,
      grades: [],
      summary: {
        gpa: null, totalTinchi: 0, totalTinchiDat: 0,
        soMon: 0, soMonDat: 0, soMonKhongDat: 0,
        gpaThongKe: null, tinchiThongKe: null, tilechuyencan: null,
      },
    });
  }

  // ── Bước 2: Lấy điểm tổng kết (nếu có) ───────────────────────────────────
  const maphancongList = enrolled.map((r: any) => r.maphancong);

  const { data: rawTongKet } = await supabase
    .from("diemtongket")
    .select("maphancong, diemtongket, diemchu, ketqua, ngaycapnhat")
    .eq("masv", masv)
    .in("maphancong", maphancongList);

  // Map maphancong → điểm tổng kết
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tongKetMap: Record<number, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rawTongKet as any[] ?? []).forEach((tk) => {
    tongKetMap[tk.maphancong] = tk;
  });

  // ── Bước 3: Lấy điểm thành phần ──────────────────────────────────────────
  const { data: rawDiem } = await supabase
    .from("diem")
    .select("maphancong, loaidiem, giatri, heso")
    .eq("masv", masv)
    .in("maphancong", maphancongList);

  // Map maphancong → điểm thành phần[]
  const diemThanhPhanMap: Record<number, { loai: string; giatri: number; heso: number }[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rawDiem as any[] ?? []).forEach((d) => {
    if (!diemThanhPhanMap[d.maphancong]) diemThanhPhanMap[d.maphancong] = [];
    diemThanhPhanMap[d.maphancong].push({
      loai: d.loaidiem,
      giatri: d.giatri,
      heso: d.heso,
    });
  });

  // ── Bước 4: Merge thành danh sách grades ─────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grades = enrolled.map((row: any, idx: number) => {
    const pc     = row.phancong;
    const mon    = pc?.monhoc;
    const tk     = tongKetMap[row.maphancong] ?? null;

    const diem   = tk?.diemtongket !== null && tk?.diemtongket !== undefined
      ? Number(tk.diemtongket)
      : null;
    const diem4  = diem !== null ? diem10ToDiem4(diem) : null;
    const diemChu = tk?.diemchu ?? (diem !== null ? diem10ToDiemChu(diem) : null);
    const dat    = tk?.ketqua === "Dat" || (diem !== null && diem >= 5.0);
    const coDiem = diem !== null;

    return {
      stt:           idx + 1,
      mamon:         pc?.mamon ?? "---",
      malophoc:      pc?.malophoc ?? "---",
      tenmon:        mon?.tenmon ?? "Chưa có tên môn",
      sotinchi:      mon?.sotinchi ?? 0,
      giangvien:     pc?.giangvien ? ([pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "---") : "---",
      diem10:        diem,
      diem4:         diem4,
      diemchu:       diemChu,
      ketqua:        tk?.ketqua ?? null,
      dat:           coDiem ? dat : false,
      coDiem,
      diemThanhPhan: diemThanhPhanMap[row.maphancong] ?? [],
    };
  });

  // ── Tính thống kê từ môn có điểm ─────────────────────────────────────────
  const gradesCoDiem = grades.filter((g) => g.coDiem && g.diem4 !== null);
  const totalTinchiCoDiem = gradesCoDiem.reduce((s, g) => s + g.sotinchi, 0);
  const totalTinchiDat = grades.filter((g) => g.dat).reduce((s, g) => s + g.sotinchi, 0);
  const totalTinchi = grades.reduce((s, g) => s + g.sotinchi, 0);

  const gpa =
    totalTinchiCoDiem > 0
      ? gradesCoDiem.reduce((s, g) => s + (g.diem4 ?? 0) * g.sotinchi, 0) / totalTinchiCoDiem
      : null;

  // ── Lấy thống kê từ bảng thongkesinhvien (nếu có) ────────────────────────
  const { data: thongKe } = await supabase
    .from("thongkesinhvien")
    .select("gpa, sotinchi, sotinchidat, somondat, somonkhongdat, tilechuyencan")
    .eq("masv", masv)
    .eq("mahocky", mahocky)
    .maybeSingle();

  return NextResponse.json({
    hocKyList,
    mahocky,
    hocKy: hocKyHienTai,
    grades,
    summary: {
      gpa:           gpa !== null ? Math.round(gpa * 100) / 100 : null,
      totalTinchi,
      totalTinchiDat,
      soMon:         grades.length,
      soMonDat:      grades.filter((g) => g.dat).length,
      soMonKhongDat: grades.filter((g) => !g.dat && g.coDiem).length,
      gpaThongKe:    thongKe?.gpa ?? null,
      tinchiThongKe: thongKe?.sotinchidat ?? null,
      tilechuyencan: thongKe?.tilechuyencan ?? null,
    },
  });
}
