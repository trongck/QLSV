import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";
import { scheduleService } from "@/services/service/sinhvien/schedule.service";

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

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sv = await sinhVienService.getBasicInfo((payload as any).mataikhoan);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? searchParams.get("view") ?? "week";
    const mahockyParam = searchParams.get("mahocky");

    const result = await scheduleService.getStudentScheduleData(sv.masv, mode, mahockyParam);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Lỗi GET /api/student/schedule:", error.message);
    const status = error.message?.includes('đăng nhập') ? 401 : 500;
    return NextResponse.json({ success: false, message: error.message }, { status });
  }
}
