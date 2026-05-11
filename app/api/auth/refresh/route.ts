import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { refreshTokenService } from "@/services/service/auth/auth-server.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const diachiip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshTokenService(
      supabase,
      refreshToken,
      diachiip
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    const res = NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    res.cookies.set("auth_access_token", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 phút
    });

    res.cookies.set("auth_refresh_token", newRefreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    });

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    const status = message.includes("hết hạn") || message.includes("không tồn tại") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
