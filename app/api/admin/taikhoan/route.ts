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

// ─── GET /api/admin/taikhoan ──────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search    = searchParams.get("search") ?? "";
  const vaitro    = searchParams.get("vaitro") ?? "";
  const trangthai = searchParams.get("trangthai") ?? "";
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit     = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const from      = (page - 1) * limit;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("taikhoan")
    .select("mataikhoan, email, vaitro, trangthai, dangnhaplancuoi", { count: "exact" })
    .order("mataikhoan", { ascending: true })
    .range(from, from + limit - 1);

  if (search)    query = query.ilike("email", `%${search}%`);
  if (vaitro)    query = query.eq("vaitro", vaitro);
  if (trangthai) query = query.eq("trangthai", trangthai);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}