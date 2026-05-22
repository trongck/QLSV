import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { diemdanhService } from "@/services/service/sinhvien/diemdanh.service";
import { sinhVienService } from "@/services/service/sinhvien/student.service";

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
//   mode     - "stats" | "history" (optional, from sinhvien dashboard)
//   mahocky  - ID học kỳ (optional)
//   filter   - "month" | "semester" (optional)

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  // ─── BRANCH: Mode "stats" or "history" (sinhvien logic) ───────────────────
  if (mode === "stats" || mode === "history") {
    try {
      const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
      const masv = sv.masv;
      const mahocky = searchParams.get("mahocky") ? parseInt(searchParams.get("mahocky")!) : undefined;

      if (mode === "stats") {
        try {
          const data = await diemdanhService.getStatsBySubject(masv, mahocky);
          return NextResponse.json({ success: true, mode: "stats", data });
        } catch (e: any) {
          console.warn("[attendance/stats] caught:", e.message);
          return NextResponse.json({ success: true, mode: "stats", data: [] });
        }
      }

      // mode === "history"
      const maphancong = searchParams.get("maphancong") ? parseInt(searchParams.get("maphancong")!) : undefined;
      const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
      const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

      let data: any[] = [];
      try {
        data = await diemdanhService.getHistory(masv, {
          mahocky, maphancong, month, year, limit,
        });
      } catch (e: any) {
        console.warn("[attendance/history] caught:", e.message);
        data = [];
      }

      return NextResponse.json({ success: true, mode: "history", data });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("sinh viên") ? 404 : 500 }
      );
    }
  }

  // ─── BRANCH: Legacy/Original student logic ────────────────────────────────
  const mahockyParam = searchParams.get("mahocky") ? Number(searchParams.get("mahocky")) : undefined;

  try {
    const data = await diemdanhService.getAttendanceFullData(payload.mataikhoan, mahockyParam);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes("sinh viên") ? 404 : 500 }
    );
  }
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

  try {
    const result = await diemdanhService.checkInStudent(payload.mataikhoan, mabuoihoc, phuongthuc, qr_data, request);

    return NextResponse.json({
      success: true,
      diemdanh: result.diemdanh,
      trangthai: result.trangthai,
      tenmon: result.tenmon,
      message:
        result.trangthai === 'Comat'
          ? "Điểm danh thành công! Bạn đến đúng giờ."
          : "Điểm danh thành công! Tuy nhiên bạn đã đến muộn hơn 10 phút.",
    });
  } catch (error: any) {
    let status = 500;
    const msg = error.message;
    if (msg.includes("không hợp lệ") || msg.includes("Thiếu")) status = 400;
    else if (msg.includes("Không tìm thấy") || msg.includes("không tồn tại")) status = 404;
    else if (msg.includes("đăng ký")) status = 403;
    else if (msg.includes("đã điểm danh") || msg.includes("kết thúc") || msg.includes("chưa được mở")) status = 409;
    return NextResponse.json({ error: msg }, { status });
  }
}
