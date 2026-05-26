import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { getResetPasswordLogsService } from "@/services/service/auth/auth-server.service";

export async function GET(request: Request) {
  try {
    // 1. Xác thực — Chỉ Admin mới được truy cập
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getSupabaseClient();

    // 2. Gọi service lấy nhật ký reset password
    const logs = await getResetPasswordLogsService(supabase);

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
