import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.Admin ? payload : null;
  } catch { return null; }
}

// ─── GET /api/admin/sinhvien/[id] ────────────────────────────────────────────

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("sinhvien")
    .select(`*, lop(tenlop, makhoa, khoa(tenkhoa)), chitietsinhvien(*), taikhoan(email, vaitro, trangthai)`)
    .eq("masv", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

// ─── PUT /api/admin/sinhvien/[id] ────────────────────────────────────────────

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { hoten, ngaysinh, gioitinh, malop, trangthai, emailtruong, chiTiet } = body;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const update: Record<string, unknown> = {};
  if (hoten)      update.hoten = hoten.trim();
  if (ngaysinh !== undefined) update.ngaysinh = ngaysinh || null;
  if (gioitinh !== undefined) update.gioitinh = gioitinh || null;
  if (malop)      update.malop = malop;
  if (trangthai)  update.trangthai = trangthai;
  if (emailtruong !== undefined) update.emailtruong = emailtruong || null;

  const { data, error } = await supabase
    .from("sinhvien")
    .update(update)
    .eq("masv", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Upsert chi tiết
  if (chiTiet && Object.keys(chiTiet).length > 0) {
    await supabase.from("chitietsinhvien").upsert({ masv: id, ...chiTiet });
  }

  return NextResponse.json({ success: true, data });
}

// ─── DELETE /api/admin/sinhvien/[id] ─────────────────────────────────────────

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Lấy mataikhoan để xoá tài khoản sau
  const { data: sv } = await supabase.from("sinhvien").select("mataikhoan").eq("masv", id).single();

  const { error } = await supabase.from("sinhvien").delete().eq("masv", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Xoá tài khoản liên kết
  if (sv?.mataikhoan) {
    await supabase.from("taikhoan").delete().eq("mataikhoan", sv.mataikhoan);
  }

  return NextResponse.json({ success: true });
}