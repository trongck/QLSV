import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireStudent(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.SinhVien ? payload : null;
  } catch {
    return null;
  }
}

// ─── GET /api/student/diary/[id] ─────────────────────────────────────────────
// Lấy chi tiết một nhật ký theo manhatky

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json({ error: "Không tìm thấy sinh viên." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("nhatky")
    .select("*")
    .eq("manhatky", manhatky)
    .eq("masv", svData.masv)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Không tìm thấy nhật ký." }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// ─── PATCH /api/student/diary/[id] ───────────────────────────────────────────
// Cập nhật nhật ký. Body JSON: { tieude?, noidung?, tamtrang? }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json({ error: "Không tìm thấy sinh viên." }, { status: 404 });
  }

  // Kiểm tra quyền sở hữu
  const { data: existing } = await supabase
    .from("nhatky")
    .select("manhatky")
    .eq("manhatky", manhatky)
    .eq("masv", svData.masv)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy nhật ký hoặc bạn không có quyền." }, { status: 404 });
  }

  // Chỉ cho phép cập nhật các trường này
  const updates: Record<string, unknown> = { ngaycapnhat: new Date().toISOString() };
  if ("tieude" in body)   updates.tieude   = body.tieude?.trim() || null;
  if ("noidung" in body)  updates.noidung  = body.noidung?.trim();
  if ("tamtrang" in body) updates.tamtrang = body.tamtrang;

  if (updates.noidung !== undefined && !updates.noidung) {
    return NextResponse.json({ error: "Nội dung không được để trống." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("nhatky")
    .update(updates)
    .eq("manhatky", manhatky)
    .eq("masv", svData.masv)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ─── DELETE /api/student/diary/[id] ──────────────────────────────────────────
// Xoá nhật ký theo manhatky

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const manhatky = Number(id);
  if (isNaN(manhatky)) {
    return NextResponse.json({ error: "ID không hợp lệ." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json({ error: "Không tìm thấy sinh viên." }, { status: 404 });
  }

  const { error } = await supabase
    .from("nhatky")
    .delete()
    .eq("manhatky", manhatky)
    .eq("masv", svData.masv);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
