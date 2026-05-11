import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateTaiKhoanUpdate } from "@/lib/validation/admin.validation";
import { updateTaiKhoanService, deleteTaiKhoanService } from "@/services/service/admin/taikhoan.service";

export async function PUT(request: Request, { params }: { params: Promise<{ mataikhoan: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mataikhoan } = await params;
    const body = await request.json();

    const validationErrors = validateTaiKhoanUpdate(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const data = await updateTaiKhoanService(supabase, mataikhoan, body);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mataikhoan: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mataikhoan } = await params;
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    await deleteTaiKhoanService(supabase, mataikhoan);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}