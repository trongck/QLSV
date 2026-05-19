import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

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

    // Resolve masv từ mataikhoan
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: sv } = await supabase
      .from("sinhvien")
      .select("masv, hoten, malop")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!sv) {
      return NextResponse.json({ error: "Không tìm thấy sinh viên" }, { status: 404 });
    }

    // Truy vấn song song: thống kê + lịch hôm nay + thông báo
    const [stats, lichHomNay, thongBao] = await Promise.all([
      sinhVienService.getDashboardStats(sv.masv),
      sinhVienService.getTodaySchedule(sv.masv),
      sinhVienService.getNotifications(sv.masv, sv.malop)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        hoten: sv.hoten,
        masv: sv.masv,
        ...stats,
        lichHocHomNay: lichHomNay,
        thongBaoGanDay: (thongBao ?? []).slice(0, 5)
      }
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/dashboard:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}
