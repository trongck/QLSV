import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { bulkAccountActionService } from "@/services/service/admin/taikhoan.service";

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, action, matkhau } = body as {
      ids: string[];
      action: "lock" | "unlock" | "reset";
      matkhau?: string;
    };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Danh sách tài khoản không hợp lệ." }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Tối đa 100 tài khoản mỗi lần." }, { status: 400 });
    }

    const supabase = await getSupabaseClient();

    const result = await bulkAccountActionService(supabase, ids, action, matkhau);

    return NextResponse.json({ success: true, affected: result.affected, data: result.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}