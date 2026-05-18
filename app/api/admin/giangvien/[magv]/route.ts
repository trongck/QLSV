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

export async function GET(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { magv } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("giangvien")
    .select(`*, khoa(tenkhoa), chitietgiangvien(*), taikhoan(email, vaitro, trangthai)`)
    .eq("magv", magv)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { magv } = await params;
  const body = await request.json();
  const { hoten, ngaysinh, gioitinh, makhoa, hocvi, chuyennganh, emailtruong, chiTiet } = body;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const update: Record<string, unknown> = {};
  if (hoten)       update.hoten = hoten.trim();
  if (ngaysinh !== undefined)   update.ngaysinh = ngaysinh || null;
  if (gioitinh !== undefined)   update.gioitinh = gioitinh || null;
  if (makhoa !== undefined)     update.makhoa = makhoa || null;
  if (hocvi !== undefined)      update.hocvi = hocvi || null;
  if (chuyennganh !== undefined) update.chuyennganh = chuyennganh || null;
  if (emailtruong !== undefined) update.emailtruong = emailtruong || null;

  const { data, error } = await supabase
    .from("giangvien")
    .update(update)
    .eq("magv", magv) 
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (chiTiet && Object.keys(chiTiet).length > 0) {
    await supabase.from("chitietgiangvien").upsert({ magv: magv, ...chiTiet });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ magv: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { magv } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: gv } = await supabase.from("giangvien").select("mataikhoan").eq("magv", magv).single();

  const { error } = await supabase.from("giangvien").delete().eq("magv", magv);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (gv?.mataikhoan) {
    await supabase.from("taikhoan").delete().eq("mataikhoan", gv.mataikhoan);
  }

  return NextResponse.json({ success: true });
}