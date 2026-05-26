import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateLichHoc } from "@/lib/validation/admin.validation";
import { updateLichHocService, deleteLichHocService } from "@/services/service/admin/lichhoc.service";

export async function PUT(request: Request, { params }: { params: Promise<{ malichhoc: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { malichhoc } = await params;
    const body = await request.json();

    const validationErrors = validateLichHoc(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await updateLichHocService(supabase, Number(malichhoc), body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ malichhoc: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { malichhoc } = await params;
    const supabase = await getSupabaseClient();

    await deleteLichHocService(supabase, Number(malichhoc));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
