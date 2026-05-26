import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { getCurrentUserService } from "@/services/service/auth/auth-server.service";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const supabase = await getSupabaseClient();

    const userProfile = await getCurrentUserService(supabase, authHeader);

    return NextResponse.json({ user: userProfile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    const status = message === "Unauthorized" || message.includes("hết hạn") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
