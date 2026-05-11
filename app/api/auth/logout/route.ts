import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { logoutService, logoutAllService } from "@/services/service/auth/auth-server.service";

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    await logoutService(supabase, refreshToken);

    const res = NextResponse.json({ success: true });

    res.cookies.delete("auth_access_token");
    res.cookies.delete("auth_refresh_token");

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mataikhoan } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    await logoutAllService(supabase, mataikhoan);

    const res = NextResponse.json({ success: true });

    res.cookies.delete("auth_access_token");
    res.cookies.delete("auth_refresh_token");

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
