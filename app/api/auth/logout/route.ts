import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { logoutService, logoutAllService } from "@/services/service/auth/auth-server.service";
import { extractClientIp } from "@/lib/utils/audit";

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken, clientIp } = body as { refreshToken?: string; clientIp?: string };

    const supabase = await getSupabaseClient();

    // Ưu tiên IP do client tự lấy (qua ipify), fallback sang headers
    const diachiip = clientIp?.trim() || extractClientIp(request);

    await logoutService(supabase, refreshToken ?? "", diachiip);

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
    const { mataikhoan, clientIp } = body as { mataikhoan?: string; clientIp?: string };

    const supabase = await getSupabaseClient();

    // Ưu tiên IP do client tự lấy (qua ipify), fallback sang headers
    const diachiip = clientIp?.trim() || extractClientIp(request);

    await logoutAllService(supabase, mataikhoan ?? "", diachiip);

    const res = NextResponse.json({ success: true });

    res.cookies.delete("auth_access_token");
    res.cookies.delete("auth_refresh_token");

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
