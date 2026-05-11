import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateThongBao } from "@/lib/validation/admin.validation";
import { updateThongbaoService, deleteThongbaoService } from "@/services/service/admin/thongbao.service";

export async function PUT(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mathongbao } = await params;
    const id = Number(mathongbao);
    const body = await request.json();

    const validationErrors = validateThongBao(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await updateThongbaoService(supabase, id, body);

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mathongbao } = await params;
    const id = Number(mathongbao);
    const supabase = createClient(await cookies());

    await deleteThongbaoService(supabase, id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mathongbao } = await params;
    const id = Number(mathongbao);
    const body = await request.json();

    const validationErrors = validateThongBao(body, false);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    // Sanitize empty values
    if (body.malop === "") body.malop = null;
    if (body.maphancong === "") body.maphancong = null;
    else if (body.maphancong !== undefined && body.maphancong !== null) body.maphancong = Number(body.maphancong);

    const supabase = createClient(await cookies());
    const data = await updateThongbaoService(supabase, id, body);

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
