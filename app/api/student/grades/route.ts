// app/api/student/grades/route.ts
import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";

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
    const { searchParams } = new URL(request.url);
    const mahockyParam = searchParams.get("mahocky"); // "all" | undefined | số

    const report = await sinhVienService.getStudentGradesReport(
      (payload as any).mataikhoan,
      mahockyParam
    );

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("Lỗi GET /api/student/grades:", error.message);
    return NextResponse.json(
      { error: error.message ?? "Lấy điểm số thất bại" },
      { status: 500 }
    );
  }
}
