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
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const namhoc = searchParams.get("namhoc") ?? "";

  const supabase = createClient(await cookies());

  let query = supabase
    .from("hocky")
    .select("*", { count: "exact" })
    .order("namhoc", { ascending: false })
    .order("ky", { ascending: true });

  if (search) query = query.ilike("tenhocky", `%${search}%`);
  if (namhoc) query = query.eq("namhoc", Number(namhoc));

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc } = body;

  if (!tenhocky?.trim()) return NextResponse.json({ error: "Tên học kỳ không được trống." }, { status: 400 });
  if (!namhoc || namhoc < 2000 || namhoc > 2100) return NextResponse.json({ error: "Năm học không hợp lệ." }, { status: 400 });
  if (![1, 2, 3].includes(Number(ky))) return NextResponse.json({ error: "Kỳ học phải là 1, 2 hoặc 3." }, { status: 400 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("hocky")
    .insert({
      tenhocky: tenhocky.trim(),
      namhoc: Number(namhoc),
      ky: Number(ky),
      ngaybatdau: ngaybatdau || null,
      ngayketthuc: ngayketthuc || null,
      danghieuluc: danghieuluc ?? false
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
