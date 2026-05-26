import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import {
  getPhongHocByCodeService,
  updatePhongHocService,
  deletePhongHocService,
  getPhongHocSchedulesService,
  checkPhongHocConflictService
} from "@/services/service/admin/phonghoc.service";

// ─── GET /api/admin/phonghoc/[maphong] ─────────────────────────────────────────
export async function GET(request: Request, { params }: { params: Promise<{ maphong: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maphong } = await params;
    const { searchParams } = new URL(request.url);
    const isSchedule = searchParams.get("schedule") === "true";
    const isConflict = searchParams.get("conflict") === "true";

    const supabase = await getSupabaseClient();

    // 1. Get classroom schedules
    if (isSchedule) {
      const data = await getPhongHocSchedulesService(supabase, maphong);
      return NextResponse.json({ success: true, data });
    }

    // 2. Inspect conflict
    if (isConflict) {
      const thutrongtuan = parseInt(searchParams.get("thutrongtuan") || "0", 10);
      const tietbatdau = parseInt(searchParams.get("tietbatdau") || "0", 10);
      const tietketthuc = parseInt(searchParams.get("tietketthuc") || "0", 10);
      const excludeLichHocId = parseInt(searchParams.get("excludeLichHocId") || "0", 10) || undefined;

      if (!thutrongtuan || !tietbatdau || !tietketthuc) {
        return NextResponse.json({ error: "Thiếu thông tin lịch biểu để kiểm tra xung đột." }, { status: 400 });
      }

      const conflictResult = await checkPhongHocConflictService(
        supabase,
        maphong,
        thutrongtuan,
        tietbatdau,
        tietketthuc,
        excludeLichHocId
      );
      return NextResponse.json({ success: true, ...conflictResult });
    }

    // 3. Default: get individual room details
    const data = await getPhongHocByCodeService(supabase, maphong);
    if (!data) {
      return NextResponse.json({ error: `Không tìm thấy phòng học ${maphong}.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PUT /api/admin/phonghoc/[maphong] ─────────────────────────────────────────
export async function PUT(request: Request, { params }: { params: Promise<{ maphong: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maphong } = await params;
    const payload = await request.json();
    const supabase = await getSupabaseClient();
    const data = await updatePhongHocService(supabase, maphong, payload);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/admin/phonghoc/[maphong] ──────────────────────────────────────
export async function DELETE(request: Request, { params }: { params: Promise<{ maphong: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { maphong } = await params;
    const supabase = await getSupabaseClient();
    await deletePhongHocService(supabase, maphong);

    return NextResponse.json({ success: true, message: `Xóa phòng học ${maphong} thành công.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
