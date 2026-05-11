import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateSinhVienUpdate } from "@/lib/validation/admin.validation";
import {
  getSinhVienByIdService,
  updateSinhVienService,
  deleteSinhVienService,
} from "@/services/service/admin/sinhvien.service";

// ─── GET /api/admin/sinhvien/[masv] ────────────────────────────────────────────

export async function GET(request: Request, { params }: { params: Promise<{ masv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { masv } = await params;
  const supabase = createClient(await cookies());

  try {
    const data = await getSinhVienByIdService(supabase, masv);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

// ─── PUT /api/admin/sinhvien/[masv] ────────────────────────────────────────────

export async function PUT(request: Request, { params }: { params: Promise<{ masv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { masv } = await params;
  const body = await request.json();

  // Sử dụng validateSinhVienUpdate chuẩn hóa
  const validationErrors = validateSinhVienUpdate(body);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  try {
    const data = await updateSinhVienService(supabase, masv, body);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ─── DELETE /api/admin/sinhvien/[masv] ─────────────────────────────────────────

export async function DELETE(request: Request, { params }: { params: Promise<{ masv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { masv } = await params;
  const supabase = createClient(await cookies());

  try {
    await deleteSinhVienService(supabase, masv);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}