import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import {
  getPhongHocListService,
  createPhongHocService,
  getRoomUtilizationStatsService
} from "@/services/service/admin/phonghoc.service";

// ─── GET /api/admin/phonghoc ──────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isUtilization = searchParams.get("utilization") === "true";
    const supabase = await getSupabaseClient();

    if (isUtilization) {
      const data = await getRoomUtilizationStatsService(supabase);
      return NextResponse.json({ success: true, data });
    }

    const data = await getPhongHocListService(supabase);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/admin/phonghoc ─────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const supabase = await getSupabaseClient();
    const data = await createPhongHocService(supabase, payload);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
