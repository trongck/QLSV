import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validatePhanCong } from "@/lib/validation/admin.validation";
import { updatePhanCongService, deletePhanCongService } from "@/services/service/admin/phancong.service";

export async function PUT(request: Request, { params }: { params: Promise<{ maphancong: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maphancong } = await params;
    const body = await request.json();

    const validationErrors = validatePhanCong(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await updatePhanCongService(supabase, parseInt(maphancong), body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ maphancong: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maphancong } = await params;
    const supabase = await getSupabaseClient();

    await deletePhanCongService(supabase, parseInt(maphancong));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
