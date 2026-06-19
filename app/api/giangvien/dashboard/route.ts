import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

// GET /api/giangvien/dashboard
// Trả về tất cả số liệu tổng quan cho màn hình dashboard giảng viên.
// Yêu cầu: Bearer token hợp lệ với vaitro = GiangVien.

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;

    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    // Lấy magv từ bảng giangvien theo mataikhoan trong token
    // getDashboardStats nhận magv — cần resolve trước
    const { getSupabaseClient } = await import("@/lib/utils/supabase/server");
    const supabase = await getSupabaseClient();

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv, hodem, ten")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const hoten = `${gv.hodem || ""} ${gv.ten || ""}`.trim();
    const stats = await giangVienService.getDashboardStats(gv.magv);

    return NextResponse.json({
      success: true,
      data: {
        hoten,
        ...stats,
      },
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/dashboard:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}
