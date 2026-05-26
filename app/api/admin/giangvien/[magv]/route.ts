import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateGiangVienUpdate } from "@/lib/validation/admin.validation";
import { getGiangVienByIdService, updateGiangVienService, deleteGiangVienService } from "@/services/service/admin/giangvien.service";

export async function GET(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { magv } = await params;
    const supabase = await getSupabaseClient();

    const data = await getGiangVienByIdService(supabase, magv);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { magv } = await params;
    const body = await request.json();

    const validationErrors = validateGiangVienUpdate(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();

    const data = await updateGiangVienService(supabase, magv, body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { magv } = await params;
    const supabase = await getSupabaseClient();

    await deleteGiangVienService(supabase, magv);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}