import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { loginService } from "@/services/service/auth/auth-server.service";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.email?.trim() || !body?.matkhau?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin." },
        { status: 400 }
      );
    }

    const { email, matkhau } = body as { email: string; matkhau: string };

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const diachiip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      null;

    const { accessToken, refreshToken, user } = await loginService(supabase, email, matkhau, diachiip);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    const res = NextResponse.json({ accessToken, refreshToken, user });

    res.cookies.set("auth_access_token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 phút
    });

    res.cookies.set("auth_refresh_token", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    });

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ.";
    console.error("[login] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}