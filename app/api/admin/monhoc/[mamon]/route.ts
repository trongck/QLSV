import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateMonHoc } from "@/lib/validation/admin.validation";
import { updateMonhocService, deleteMonhocService } from "@/services/service/admin/monhoc.service";

export async function PUT(request: Request, { params }: { params: Promise<{ mamon: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mamon } = await params;
    const body = await request.json();

    const validationErrors = validateMonHoc({ ...body, mamon }, false);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await updateMonhocService(supabase, mamon, body);

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mamon: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mamon } = await params;
    const supabase = createClient(await cookies());

    await deleteMonhocService(supabase, mamon);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message.includes("Môn học đang có phân công") ? 409 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
