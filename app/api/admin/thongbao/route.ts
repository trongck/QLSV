import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateThongBao } from "@/lib/validation/admin.validation";
import { getThongbaoListService, createThongbaoService } from "@/services/service/admin/thongbao.service";

export async function GET(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const loai = searchParams.get("loai") ?? "";
  const doituong = searchParams.get("doituong") ?? "";
  const trangthai = searchParams.get("trangthai") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 15)));

  try {
    const supabase = createClient(await cookies());
    const { data, total } = await getThongbaoListService(supabase, {
      search,
      loai,
      doituong,
      trangthai,
      page,
      limit,
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const validationErrors = validateThongBao(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await createThongbaoService(supabase, adminPayload.mataikhoan, body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


//