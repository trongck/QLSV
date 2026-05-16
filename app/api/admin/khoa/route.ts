import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.Admin) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── GET /api/admin/khoa ──────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("khoa")
    .select("makhoa, tenkhoa, dienthoai, email, ngaytao")
    .order("ngaytao", { ascending: false });

  if (search) query = query.ilike("tenkhoa", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}

// ─── POST /api/admin/khoa ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { makhoa, tenkhoa, dienthoai, email } = body;

  if (!makhoa?.trim() || !tenkhoa?.trim())
    return NextResponse.json({ error: "Mã khoa và tên khoa là bắt buộc." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("khoa")
    .insert({ makhoa: makhoa.trim(), tenkhoa: tenkhoa.trim(), dienthoai: dienthoai || null, email: email || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "INSERT",
    tentable: "khoa",
    makhoachinh: makhoa.trim(),
    giatrimoi: data,
    request,
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}