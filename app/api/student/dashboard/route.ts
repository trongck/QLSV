import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";

// GET /api/sinhvien/dashboard
// Trả về thống kê tổng quan, lịch học hôm nay, thông báo gần đây, điểm gần đây.

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const dashboardData = await sinhVienService.getDashboardData(payload.mataikhoan);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/dashboard:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 500 }
    );
  }
}
