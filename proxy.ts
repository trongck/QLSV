import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/middleware";
import { verifyToken, signAccessToken } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

const ROLE_PREFIXES = {
  [VaiTro.Admin]: "/admin",
  [VaiTro.GiangVien]: "/teacher",
  [VaiTro.SinhVien]: "/student",
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = createClient(request);

  // 1. Cho phép các route public và API chạy qua thoải mái (vì API có cơ chế requireAdmin nội bộ)
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname === "/"
  ) {
    return supabaseResponse;
  }

  // 2. Xác định vai trò yêu cầu từ URL prefix
  let requiredRole: VaiTro | null = null;
  if (pathname.startsWith("/admin")) requiredRole = VaiTro.Admin;
  else if (pathname.startsWith("/teacher")) requiredRole = VaiTro.GiangVien;
  else if (pathname.startsWith("/student")) requiredRole = VaiTro.SinhVien;

  if (!requiredRole) {
    return supabaseResponse;
  }

  // 3. Trích xuất access token từ cookie
  let accessToken = request.cookies.get("auth_access_token")?.value;
  let payload = null;

  if (accessToken) {
    try {
      payload = await verifyToken(accessToken);
    } catch {
      // Access token hết hạn hoặc không hợp lệ, sẽ tự động refresh bên dưới nếu có refresh token cookie
    }
  }

  // 4. Tự động Silent Refresh ngay trong Proxy nếu Access Token hết hạn nhưng Refresh Token còn hạn
  if (!payload) {
    const refreshToken = request.cookies.get("auth_refresh_token")?.value;
    if (refreshToken) {
      try {
        const refreshPayload = await verifyToken(refreshToken);
        const newPayload = {
          mataikhoan: refreshPayload.mataikhoan,
          email: refreshPayload.email,
          vaitro: refreshPayload.vaitro,
        };
        accessToken = await signAccessToken(newPayload);
        payload = newPayload;
      } catch {
        // Refresh token cũng đã hết hạn hoặc không hợp lệ
      }
    }
  }

  // 5. Nếu không xác thực được, điều hướng về trang đăng nhập kèm redirect url
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth_access_token");
    response.cookies.delete("auth_refresh_token");
    return response;
  }

  // 6. Kiểm tra quyền truy cập (Role Guard)
  if (payload.vaitro !== requiredRole) {
    const correctPrefix = ROLE_PREFIXES[payload.vaitro as VaiTro];
    if (correctPrefix) {
      return NextResponse.redirect(new URL(`${correctPrefix}/dashboard`, request.url));
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth_access_token");
    response.cookies.delete("auth_refresh_token");
    return response;
  }

  // 7. Nếu vừa thực hiện silent refresh, cập nhật lại cookie mới về client
  let response = supabaseResponse;
  const currentAccessToken = request.cookies.get("auth_access_token")?.value;
  if (accessToken && accessToken !== currentAccessToken) {
    response = NextResponse.next();
    response.cookies.set("auth_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 phút
    });
  }

  return response;
}

export const config = {
  matcher: [
    // Khớp tất cả trừ file tĩnh, ảnh, favicon
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
