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

// ─── GET /api/admin/lop ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search   = searchParams.get("search") ?? "";
  const makhoa   = searchParams.get("makhoa") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const from     = (page - 1) * limit;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("lop")
    .select("malop, tenlop, nganh, khoahoc, siso, makhoa, magv, khoa(tenkhoa), giangvien(hoten)", { count: "exact" })
    .order("malop", { ascending: true })
    .range(from, from + limit - 1);

  if (search)  query = query.ilike("tenlop", `%${search}%`);
  if (makhoa)  query = query.eq("makhoa", makhoa);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}

// ─── POST /api/admin/lop ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { malop, tenlop, makhoa, nganh, khoahoc, magv } = body;

  if (!malop?.trim() || !tenlop?.trim())
    return NextResponse.json({ error: "Mã lớp và tên lớp là bắt buộc." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("lop")
    .insert({
      malop: malop.trim(),
      tenlop: tenlop.trim(),
      makhoa: makhoa || null,
      nganh: nganh || null,
      khoahoc: khoahoc || null,
      magv: magv || null,
      siso: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}