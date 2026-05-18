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

// ─── PUT /api/admin/taikhoan/[mataikhoan] — đổi trạng thái hoặc reset mật khẩu ───────

export async function PUT(request: Request, { params }: { params: Promise<{ mataikhoan: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mataikhoan } = await params;
  const body = await request.json();
  const { trangthai, matkhau } = body;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const update: Record<string, unknown> = {};
  if (trangthai) update.trangthai = trangthai;
  if (matkhau?.trim()) update.matkhau = matkhau.trim(); // hash via trigger

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Không có thông tin cập nhật." }, { status: 400 });

  const { data, error } = await supabase
    .from("taikhoan")
    .update(update)
    .eq("mataikhoan", mataikhoan)
    .select("mataikhoan, email, vaitro, trangthai, dangnhaplancuoi")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

// ─── DELETE /api/admin/taikhoan/[mataikhoan] ─────────────────────────────────────────

export async function DELETE(request: Request, { params }: { params: Promise<{ mataikhoan: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mataikhoan } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("taikhoan").delete().eq("mataikhoan", mataikhoan);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}