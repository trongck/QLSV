import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { resetPasswordRequestService } from "@/services/service/auth/auth-server.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const diachiip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const result = await resetPasswordRequestService(supabase, body, diachiip);

    return NextResponse.json({
      success: true,
      message: result.emailSent
        ? "Cấp lại mật khẩu mới thành công! Mật khẩu mới của bạn đã được gửi tới email cá nhân đăng ký."
        : "Cấp lại mật khẩu mới thành công và đã cập nhật vào hệ thống! Tuy nhiên, hệ thống không thể gửi email tự động (vui lòng liên hệ Admin để kiểm tra cấu hình EmailJS). Mật khẩu mới là ngày sinh dạng dd/mm/yy của bạn.",
      email: result.email,
      password: result.newPassword,
      status: "Mật khẩu mới của bạn là:"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi hệ thống nội bộ.";
    console.error("[reset-password-auto] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
