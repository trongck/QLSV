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
  const makhoa = searchParams.get("makhoa") ?? "";
  const batbuoc = searchParams.get("batbuoc") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 15)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());

  let query = supabase
    .from("monhoc")
    .select("*, khoa:makhoa(tenkhoa)", { count: "exact" })
    .order("ngaytao", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.or(`tenmon.ilike.%${search}%,mamon.ilike.%${search}%`);
  if (makhoa) query = query.eq("makhoa", makhoa);
  if (batbuoc !== "") query = query.eq("batbuoc", batbuoc === "true");

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Thêm thống kê
  const { count: countRequired } = await supabase.from("monhoc").select("*", { count: "exact", head: true }).eq("batbuoc", true);
  const { count: countOptional } = await supabase.from("monhoc").select("*", { count: "exact", head: true }).eq("batbuoc", false);
  const { count: totalAll } = await supabase.from("monhoc").select("*", { count: "exact", head: true });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
      countRequired: countRequired ?? 0,
      countOptional: countOptional ?? 0,
      totalAll: totalAll ?? 0,
    },
  });
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mamon, tenmon, sotinchi, sotietlythuyet, sotietthuchanh, mota, batbuoc, makhoa } = body;

  if (!mamon?.trim()) return NextResponse.json({ error: "Mã môn không được trống." }, { status: 400 });
  if (!tenmon?.trim()) return NextResponse.json({ error: "Tên môn không được trống." }, { status: 400 });
  if (!sotinchi || Number(sotinchi) < 1 || Number(sotinchi) > 10) return NextResponse.json({ error: "Số tín chỉ phải từ 1-10." }, { status: 400 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("monhoc")
    .insert({
      mamon: mamon.trim().toUpperCase(),
      tenmon: tenmon.trim(),
      sotinchi: Number(sotinchi),
      sotietlythuyet: sotietlythuyet ? Number(sotietlythuyet) : null,
      sotietthuchanh: sotietthuchanh ? Number(sotietthuchanh) : null,
      mota: mota?.trim() || null,
      batbuoc: Boolean(batbuoc),
      makhoa: makhoa || null,
    })
    .select("*, khoa:makhoa(tenkhoa)")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Mã môn đã tồn tại." }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 201 });
}
