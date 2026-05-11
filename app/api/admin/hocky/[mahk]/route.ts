import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateHocKy } from "@/lib/validation/admin.validation";
import { updateHockyService, deleteHockyService, activateHockyService } from "@/services/service/admin/hocky.service";

export async function PUT(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mahk } = await params;
    const id = Number(mahk);
    const body = await request.json();

    const validationErrors = validateHocKy(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await updateHockyService(supabase, id, body);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mahk } = await params;
    const id = Number(mahk);
    const supabase = createClient(await cookies());

    await deleteHockyService(supabase, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // 409 Conflict for FK violation
    if (err.message.includes("không thể xoá")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mahk } = await params;
    const id = Number(mahk);
    const supabase = createClient(await cookies());

    const data = await activateHockyService(supabase, id);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
