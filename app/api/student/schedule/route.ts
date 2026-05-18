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

// ─── Tiết → giờ ──────────────────────────────────────────────────────────────

const TIET_TIME: Record<number, string> = {
  1: "07:00",  2: "07:50",  3: "08:40",  4: "09:30",  5: "10:20",
  6: "11:10",  7: "13:00",  8: "13:50",  9: "14:40", 10: "15:30",
  11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
};

function tietToTime(tiet: number): string {
  return TIET_TIME[tiet] ?? `${tiet}:00`;
}

// Thứ trong tuần sang tên tiếng Việt
const THU_LABEL: Record<number, string> = {
  2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4",
  5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật",
};

// Màu sắc xoay vòng cho các môn học
const COLORS = [
  "bg-red-50 text-red-700 border-red-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-yellow-50 text-yellow-700 border-yellow-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-cyan-50 text-cyan-700 border-cyan-200",
];

// ─── GET /api/student/schedule ────────────────────────────────────────────────
// Query params:
//   view      - "week" | "semester" (default: "week")
//   mahocky   - ID học kỳ (optional, default: học kỳ hiện tại)

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view     = (searchParams.get("view") ?? "week") as "week" | "semester";
  const mahockyParam = searchParams.get("mahocky");

  const supabase = createClient(await cookies());

  // ── Lấy thông tin sinh viên ───────────────────────────────────────────────
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv, malop")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json({ error: "Không tìm thấy thông tin sinh viên." }, { status: 404 });
  }

  const { masv } = svData;

  // ── Lấy danh sách học kỳ ──────────────────────────────────────────────────
  const { data: dsHocKy } = await supabase
    .from("hocky")
    .select("mahocky, tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc")
    .order("namhoc", { ascending: false })
    .order("ky", { ascending: false });

  const hocKyList = dsHocKy ?? [];

  // Xác định học kỳ đang xem
  let mahocky: number;
  if (mahockyParam) {
    mahocky = Number(mahockyParam);
  } else {
    // Ưu tiên học kỳ đang hiệu lực
    const active = hocKyList.find((hk) => hk.danghieuluc);
    mahocky = active ? active.mahocky : (hocKyList[0]?.mahocky ?? 0);
  }

  const hocKyHienTai = hocKyList.find((hk) => hk.mahocky === mahocky);

  if (!hocKyHienTai) {
    return NextResponse.json({
      hocKyList,
      mahocky: null,
      hocKy: null,
      data: [],
      view,
    });
  }

  // ── Lấy lịch học: sinhvienmonhoc → phancong → lichHoc ─────────────────────
  const { data: rawData, error: schedError } = await supabase
    .from("sinhvienmonhoc")
    .select(`
      maphancong,
      trangthai,
      phancong:maphancong (
        maphancong,
        mahocky,
        magv,
        mamon,
        malop,
        danghieuluc,
        ngaybatdau,
        ngayketthuc,
        monhoc:mamon ( tenmon, sotinchi ),
        giangvien:magv ( hodem, ten ),
        lichhoc ( malichhoc, thutrongtuan, tietbatdau, tietketthuc, maphong, ghichu )
      )
    `)
    .eq("masv", masv);

  if (schedError) {
    return NextResponse.json({ error: schedError.message }, { status: 500 });
  }

  // Lọc theo học kỳ đang chọn (cast về any[] vì Supabase không infer kiểu nested join)
  const now = new Date();
  // Get local YYYY-MM-DD string handling timezone offset
  const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inSemester = (rawData as any[]).filter((row) => {
    const pc = Array.isArray(row.phancong) ? row.phancong[0] : row.phancong;
    row.phancong = pc; // chuẩn hóa lại thành object nếu nó bị bọc trong array
    
    if (!pc || Number(pc.mahocky) !== mahocky || pc.danghieuluc === false) {
      return false;
    }

    if (pc.ngayketthuc) {
      // String comparison format YYYY-MM-DD
      const endDateStr = String(pc.ngayketthuc).split('T')[0];
      if (endDateStr < todayStr) {
        return false;
      }
    }

    return true;
  });

  // Gán màu ổn định theo mamon
  const colorMap: Record<string, string> = {};
  let colorIdx = 0;
  inSemester.forEach((row: any) => {
    const mamon = row.phancong?.mamon;
    if (mamon && !colorMap[mamon]) {
      colorMap[mamon] = COLORS[colorIdx % COLORS.length];
      colorIdx++;
    }
  });

  // ── Dạng HỌC KỲ: trả về danh sách môn ───────────────────────────────────
  if (view === "semester") {
    const subjects = inSemester.map((row: any) => {
      const pc = row.phancong;
      const mon = pc?.monhoc;
      const gv = pc?.giangvien;
      const lichs = pc?.lichhoc ?? [];

      // Nhóm lịch học theo thứ
      const scheduleItems = lichs.map((lh: any) => ({
        malichhoc: lh.malichhoc,
        thu: lh.thutrongtuan,
        thuLabel: THU_LABEL[lh.thutrongtuan] ?? `Thứ ${lh.thutrongtuan}`,
        tietBatDau: lh.tietbatdau,
        tietKetThuc: lh.tietketthuc,
        gioVao:  tietToTime(lh.tietbatdau),
        gioRa:   tietToTime(lh.tietketthuc),
        phonghoc: lh.maphong ?? "---",
        ghichu: lh.ghichu ?? null,
      }));

      return {
        maphancong: pc?.maphancong,
        mamon: pc?.mamon,
        tenmon: mon?.tenmon ?? "Chưa có tên môn",
        sotinchi: mon?.sotinchi ?? 0,
        giangvien: gv ? ([gv.hodem, gv.ten].filter(Boolean).join(" ") || "Đang cập nhật") : "Đang cập nhật",
        color: colorMap[pc?.mamon] ?? COLORS[0],
        scheduleItems,
      };
    });

    return NextResponse.json({
      hocKyList,
      mahocky,
      hocKy: hocKyHienTai,
      view,
      data: subjects,
    });
  }

  // ── Dạng TUẦN: trả về lịch dạng timetable theo ngày × tiết ──────────────
  // Mỗi ô là một buổi học: { thu, tietBatDau, tietKetThuc, tenmon, phonghoc, giangvien, color, maphancong }
  const weekItems: Array<{
    maphancong: number;
    mamon: string;
    tenmon: string;
    giangvien: string;
    thu: number;
    thuLabel: string;
    tietBatDau: number;
    tietKetThuc: number;
    gioVao: string;
    gioRa: string;
    phonghoc: string;
    ghichu: string | null;
    color: string;
  }> = [];

  for (const row of inSemester) {
    const pc  = row.phancong;
    const mon = pc?.monhoc;
    const gv  = pc?.giangvien;
    const lichs = pc?.lichhoc ?? [];

    for (const lh of lichs) {
      weekItems.push({
        maphancong: pc?.maphancong,
        mamon:      pc?.mamon,
        tenmon:     mon?.tenmon ?? "Chưa có tên môn",
        giangvien:  gv ? ([gv.hodem, gv.ten].filter(Boolean).join(" ") || "Đang cập nhật") : "Đang cập nhật",
        thu:        lh.thutrongtuan,
        thuLabel:   THU_LABEL[lh.thutrongtuan] ?? `Thứ ${lh.thutrongtuan}`,
        tietBatDau: lh.tietbatdau,
        tietKetThuc: lh.tietketthuc,
        gioVao:     tietToTime(lh.tietbatdau),
        gioRa:      tietToTime(lh.tietketthuc),
        phonghoc:   lh.maphong ?? "---",
        ghichu:     lh.ghichu ?? null,
        color:      colorMap[pc?.mamon] ?? COLORS[0],
      });
    }
  }

  // Sắp xếp theo thứ rồi theo tiết bắt đầu
  weekItems.sort((a, b) =>
    a.thu !== b.thu ? a.thu - b.thu : a.tietBatDau - b.tietBatDau
  );

  return NextResponse.json({
    hocKyList,
    mahocky,
    hocKy: hocKyHienTai,
    view,
    data: weekItems,
  });
}
