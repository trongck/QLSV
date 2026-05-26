import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateKhoa } from "@/lib/validation/admin.validation";
import { updateKhoaService, deleteKhoaService } from "@/services/service/admin/khoa.service";

// ─── PUT /api/admin/khoa/[makhoa] ─────────────────────────────────────────────────

export async function PUT(request: Request, { params }: { params: Promise<{ makhoa: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { makhoa } = await params;
    const body = await request.json();

    // Sử dụng validateKhoa (isCreate = false)
    const validationErrors = validateKhoa({ ...body, makhoa }, false);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await updateKhoaService(supabase, makhoa, body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// ─── DELETE /api/admin/khoa/[makhoa] ─────────────────────────────────────────────

export async function DELETE(request: Request, { params }: { params: Promise<{ makhoa: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { makhoa } = await params;
    const supabase = await getSupabaseClient();

    await deleteKhoaService(supabase, makhoa);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}