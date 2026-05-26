import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import { bulkImportSinhVienService } from "@/services/service/admin/sinhvien.services/sinhvien.service";

export type { ImportRow, ImportRowResult, BulkImportResponse } from "@/services/service/admin/sinhvien.services/sinhvien.service";

// ─── POST /api/admin/sinhvien/bulk-import ─────────────────────────────────────

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { rows, validateOnly = true } = body;

    const supabase = await getSupabaseClient();

    const result = await bulkImportSinhVienService(supabase, rows, validateOnly);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}