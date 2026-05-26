import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function getTeacherPayload(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) return null;
    return payload;
  } catch {
    return null;
  }
}

// PATCH /api/giangvien/notifications/[mathongbao]
// Updates the fields of an announcement created by this teacher
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const supabase = await getSupabaseClient();

    // 1. Verify notification exists and was created by this teacher
    const { data: existing, error: fetchError } = await supabase
      .from("thongbao")
      .select("mataikhoantao")
      .eq("mathongbao", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
    }

    if (existing.mataikhoantao !== payload.mataikhoan) {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa thông báo này" },
        { status: 403 }
      );
    }

    // 2. Perform the update
    const updatePayload: Record<string, any> = {};
    if (body.tieude !== undefined) updatePayload.tieude = body.tieude.trim();
    if (body.noidung !== undefined) updatePayload.noidung = body.noidung.trim();
    if (body.loai !== undefined) updatePayload.loai = body.loai;
    if (body.doituong !== undefined) updatePayload.doituong = body.doituong;
    if (body.malop !== undefined) updatePayload.malop = body.malop || null;
    if (body.maphancong !== undefined) {
      updatePayload.maphancong = body.maphancong ? Number(body.maphancong) : null;
    }
    if (body.ngayhethan !== undefined) updatePayload.ngayhethan = body.ngayhethan || null;
    if (body.ghim !== undefined) updatePayload.ghim = Boolean(body.ghim);
    if (body.ngaytao !== undefined) updatePayload.ngaytao = body.ngaytao;

    updatePayload.ngaycapnhat = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("thongbao")
      .update(updatePayload)
      .eq("mathongbao", id)
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/giangvien/notifications/[mathongbao]
// Deletes an announcement created by this teacher
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ" }, { status: 400 });
  }

  try {
    const supabase = await getSupabaseClient();

    // 1. Verify notification exists and was created by this teacher
    const { data: existing, error: fetchError } = await supabase
      .from("thongbao")
      .select("mataikhoantao")
      .eq("mathongbao", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
    }

    if (existing.mataikhoantao !== payload.mataikhoan) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa thông báo này" },
        { status: 403 }
      );
    }

    // 1.5 Delete related read status records first to avoid foreign key violation
    await supabase
      .from("thongbaodadoc")
      .delete()
      .eq("mathongbao", id);

    // 2. Perform delete
    const { error: deleteError } = await supabase
      .from("thongbao")
      .delete()
      .eq("mathongbao", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
