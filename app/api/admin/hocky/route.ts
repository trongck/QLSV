import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateHocKy } from "@/lib/validation/admin.validation";
import { getHockyListService, createHockyService } from "@/services/service/admin/hocky.service";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const namhoc = searchParams.get("namhoc");

  try {
    const supabase = createClient(await cookies());
    const { data, total } = await getHockyListService(supabase, {
      search,
      namhoc: namhoc ? Number(namhoc) : undefined,
    });
    return NextResponse.json({ data, total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationErrors = validateHocKy(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await createHockyService(supabase, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
