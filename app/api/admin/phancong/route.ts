import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validatePhanCong } from "@/lib/validation/admin.validation";
import { getPhanCongListService, createPhanCongService } from "@/services/service/admin/phancong.service";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const magv = searchParams.get("magv") ?? "";
  const mamon = searchParams.get("mamon") ?? "";
  const malop = searchParams.get("malop") ?? "";
  const mahocky = searchParams.get("mahocky") ?? "";

  const page = searchParams.has("page") ? Math.max(1, parseInt(searchParams.get("page") ?? "1")) : undefined;
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  try {
    const supabase = await getSupabaseClient();
    const { data, total } = await getPhanCongListService(supabase, {
      search,
      magv,
      mamon,
      malop,
      mahocky,
      page,
      limit,
    });

    if (page !== undefined) {
      return NextResponse.json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({ success: true, data });
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

    const validationErrors = validatePhanCong(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await createPhanCongService(supabase, body);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
