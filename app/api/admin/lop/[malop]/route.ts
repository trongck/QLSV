import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateLop } from "@/lib/validation/admin.validation";
import { updateLopService, deleteLopService } from "@/services/service/admin/lop.service";

export async function PUT(request: Request, { params }: { params: Promise<{ malop: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { malop } = await params;
    const body = await request.json();

    const validationErrors = validateLop({ ...body, malop }, false);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await updateLopService(supabase, malop, body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ malop: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { malop } = await params;
    const supabase = await getSupabaseClient();

    await deleteLopService(supabase, malop);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}