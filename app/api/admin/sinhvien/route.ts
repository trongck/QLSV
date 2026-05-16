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

// ─── GET /api/admin/sinhvien ──────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search    = searchParams.get("search") ?? "";
  const malop     = searchParams.get("malop") ?? "";
  const makhoa    = searchParams.get("makhoa") ?? "";
  const trangthai = searchParams.get("trangthai") ?? "";
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit     = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const from      = (page - 1) * limit;

  const supabase = createClient(await cookies());

  let query = supabase
    .from("sinhvien")
    .select(
      `masv, hoten, ngaysinh, gioitinh, emailtruong, trangthai, malop,
       lop(tenlop, makhoa, khoa(tenkhoa)),
       chitietsinhvien(sodienthoai, emailcanhan, cccd)`,
      { count: "exact" }
    )
    .order("masv", { ascending: true })
    .range(from, from + limit - 1);

  if (search)    query = query.or(`hoten.ilike.%${search}%,masv.ilike.%${search}%`);
  if (malop)     query = query.eq("malop", malop);
  if (trangthai) query = query.eq("trangthai", trangthai);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered = makhoa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (data ?? []).filter((sv: any) => sv.lop?.makhoa === makhoa)
    : (data ?? []);

  return NextResponse.json({
    success: true,
    data: filtered,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}

// ─── POST /api/admin/sinhvien ─────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { masv, malop, hoten, ngaysinh, gioitinh, emailtruong, email, matkhau, chiTiet } = body;

  if (!masv?.trim() || !malop?.trim() || !hoten?.trim() || !email?.trim() || !matkhau?.trim())
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });

  const supabase = createClient(await cookies());

  // 1. Hash mật khẩu bằng hàm PostgreSQL
  const { data: hashed, error: hashErr } = await supabase
    .rpc("hash_password", { password: matkhau });

  if (hashErr || !hashed)
    return NextResponse.json({ error: "Lỗi hash mật khẩu." }, { status: 500 });

  // 2. Tạo tài khoản với mật khẩu đã hash
  const { data: tk, error: tkErr } = await supabase
    .from("taikhoan")
    .insert({
      mataikhoan: masv.trim(),
      email:      email.trim(),
      matkhau:    hashed,
      vaitro:     "SinhVien",
      trangthai:  "HoatDong",
    })
    .select("mataikhoan")
    .single();

  if (tkErr)
    return NextResponse.json({ error: "Không thể tạo tài khoản: " + tkErr.message }, { status: 400 });

  // 3. Tạo sinh viên
  const { data: sv, error: svErr } = await supabase
    .from("sinhvien")
    .insert({
      masv:        masv.trim(),
      malop:       malop.trim(),
      hoten:       hoten.trim(),
      ngaysinh:    ngaysinh || null,
      gioitinh:    gioitinh || null,
      emailtruong: emailtruong || null,
      trangthai:   "Danghoc",
      mataikhoan:  tk.mataikhoan,
    })
    .select()
    .single();

  if (svErr)
    return NextResponse.json({ error: svErr.message }, { status: 400 });

  // 4. Chi tiết sinh viên nếu có
  if (chiTiet && Object.keys(chiTiet).length > 0) {
    await supabase.from("chitietsinhvien").insert({ masv: masv.trim(), ...chiTiet });
  }

  return NextResponse.json({ success: true, data: sv }, { status: 201 });
}