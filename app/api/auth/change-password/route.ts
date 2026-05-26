import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { getCurrentUserService, changePasswordService } from "@/services/service/auth/auth-server.service";

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const supabase = await getSupabaseClient();

    // 1. Xác thực người dùng hiện tại qua Session JWT
    const userProfile = await getCurrentUserService(supabase, authHeader);
    if (!userProfile?.mataikhoan) {
      return NextResponse.json({ error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn." }, { status: 401 });
    }

    // 2. Đọc mật khẩu cũ và mật khẩu mới
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // Trích xuất địa chỉ IP người dùng
    const diachiip = request.headers.get("x-forwarded-for") || "127.0.0.1";

    // 3. Gọi tầng nghiệp vụ để xử lý thay đổi mật khẩu
    const result = await changePasswordService(
      supabase,
      userProfile.mataikhoan,
      oldPassword,
      newPassword,
      diachiip
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi hệ thống khi thay đổi mật khẩu.";
    const status = message.includes("chính xác") || message.includes("điền đầy đủ") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
