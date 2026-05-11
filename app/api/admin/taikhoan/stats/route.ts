import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { getTaiKhoanStatsService } from "@/services/service/admin/taikhoan.service";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const stats = await getTaiKhoanStatsService(supabase);

    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}