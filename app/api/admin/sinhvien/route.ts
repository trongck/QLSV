import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { validateSinhVienCreate } from "@/lib/validation/admin.validation";
import { getSinhVienListService, createSinhVienService } from "@/services/service/admin/sinhvien.service";

// ─── GET /api/admin/sinhvien ──────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const malop = searchParams.get("malop") ?? "";
  const makhoa = searchParams.get("makhoa") ?? "";
  const trangthai = searchParams.get("trangthai") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const supabase = createClient(await cookies());

  try {
    const { data, total } = await getSinhVienListService(supabase, {
      search,
      malop,
      makhoa,
      trangthai,
      page,
      limit,
    });

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST /api/admin/sinhvien ─────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Sử dụng bộ giải pháp validate chuẩn hóa từ admin.validation.ts
  const validationErrors = validateSinhVienCreate(body);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors[0].message, errors: validationErrors }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  try {
    const data = await createSinhVienService(supabase, body);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}