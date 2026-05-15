import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function requireAuth(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

async function resolveIds(supabase: any, mataikhoan: string, vaitro: VaiTro) {
  if (vaitro === VaiTro.SinhVien) {
    const { data } = await supabase.from("sinhvien").select("masv").eq("mataikhoan", mataikhoan).single();
    return { masv: data?.masv ?? null, magv: null };
  }
  if (vaitro === VaiTro.GiangVien) {
    const { data } = await supabase.from("giangvien").select("magv").eq("mataikhoan", mataikhoan).single();
    return { masv: null, magv: data?.magv ?? null };
  }
  return { masv: null, magv: null };
}

// GET: lấy tin nhắn
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 30)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  // Lấy tin nhắn — không join FK phức tạp để tránh lỗi RLS
  const { data: msgs, error, count } = await supabase
    .from("tinnhan")
    .select("matinnhan, macuoctrochuyen, masvgui, magvgui, noidung, filedinh, dachinh, ngaytao", { count: "exact" })
    .eq("macuoctrochuyen", convId)
    .order("ngaytao", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  if (masv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("masv", masv);
  else if (magv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("magv", magv);

  return NextResponse.json({
    data: msgs ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    me: { masv, magv },
  });
}

// POST: gửi tin nhắn
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const body = await req.json();
  const { noidung, filedinh } = body;
  if (!noidung?.trim() && !filedinh) return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 });

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  const { data, error } = await supabase
    .from("tinnhan")
    .insert({ macuoctrochuyen: convId, masvgui: masv, magvgui: magv, noidung: noidung?.trim() ?? "", filedinh: filedinh ?? null, dachinh: false })
    .select("matinnhan, macuoctrochuyen, masvgui, magvgui, noidung, filedinh, dachinh, ngaytao")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  if (masv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("masv", masv);
  else if (magv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("magv", magv);

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE: xóa hội thoại
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());

  // Xóa tin nhắn → thành viên → hội thoại
  await supabase.from("tinnhan").delete().eq("macuoctrochuyen", convId);
  await supabase.from("thanhvientrochuyen").delete().eq("macuoctrochuyen", convId);
  const { error } = await supabase.from("cuoctrochuyen").delete().eq("macuoctrochuyen", convId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
