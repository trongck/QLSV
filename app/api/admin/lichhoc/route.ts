import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateLichHoc } from "@/lib/validation/admin.validation";
import { getLichHocListService, createLichHocService } from "@/services/service/admin/lichhoc.service";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  const maphancong = searchParams.get("maphancong") ?? undefined;
  const thutrongtuan = searchParams.get("thutrongtuan") ?? undefined;
  const magv = searchParams.get("magv") ?? undefined;
  const malop = searchParams.get("malop") ?? undefined;
  const mahocky = searchParams.get("mahocky") ?? undefined;
  const maphong = searchParams.get("maphong") ?? undefined;
  const status = (searchParams.get("status") as any) ?? undefined;

  const hasPage = searchParams.has("page");

  try {
    const supabase = await getSupabaseClient();
    const { data, total } = await getLichHocListService(supabase, {
      maphancong,
      thutrongtuan,
      magv,
      malop,
      mahocky,
      maphong,
      status,
      page,
      limit,
      hasPage,
    });

    if (hasPage) {
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

    const validationErrors = validateLichHoc(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = await getSupabaseClient();
    const data = await createLichHocService(supabase, body);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 400 });
  }
}
