import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateKhoa } from "@/lib/validation/admin.validation";
import { getKhoaListService, createKhoaService } from "@/services/service/admin/khoa.service";

// ─── GET /api/admin/khoa ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  try {
    const supabase = await getSupabaseClient();
    const data = await getKhoaListService(supabase, search);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/admin/khoa ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    
    // Sử dụng bộ giải pháp validate chuẩn hóa từ admin.validation.ts
    const validationErrors = validateKhoa(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await createKhoaService(supabase, body);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}