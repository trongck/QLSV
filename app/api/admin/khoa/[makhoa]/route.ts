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

// ─── PUT /api/admin/khoa/[makhoa] ─────────────────────────────────────────────────

export async function PUT(request: Request, { params }: { params: Promise<{ makhoa: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { makhoa } = await params;
  const body = await request.json();
  const { tenkhoa, dienthoai, email } = body;

  if (!tenkhoa?.trim())
    return NextResponse.json({ error: "Tên khoa là bắt buộc." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("khoa")
    .update({ tenkhoa: tenkhoa.trim(), dienthoai: dienthoai || null, email: email || null })
    .eq("makhoa", makhoa)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}

// ─── DELETE /api/admin/khoa/[makhoa] ─────────────────────────────────────────────

export async function DELETE(request: Request, { params }: { params: Promise<{ makhoa: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { makhoa } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("khoa").delete().eq("makhoa", makhoa);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}