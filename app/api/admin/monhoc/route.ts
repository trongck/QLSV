import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateMonHoc } from "@/lib/validation/admin.validation";
import { getMonhocListService, createMonhocService } from "@/services/service/admin/monhoc.service";

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const makhoa = searchParams.get("makhoa") ?? "";
  const batbuoc = searchParams.get("batbuoc") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 15)));

  try {
    const supabase = createClient(await cookies());
    const { data, total, stats } = await getMonhocListService(supabase, {
      search,
      makhoa,
      batbuoc,
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
        countRequired: stats.countRequired,
        countOptional: stats.countOptional,
        totalAll: stats.totalAll,
      },
    });
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

    const validationErrors = validateMonHoc(body, true);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
    }

    const supabase = createClient(await cookies());
    const data = await createMonhocService(supabase, body);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    const status = err.message.includes("Mã môn đã tồn tại") ? 409 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
