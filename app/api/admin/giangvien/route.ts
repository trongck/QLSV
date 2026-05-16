import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.Admin ? payload : null;
  } catch { return null; }
}

// ─── GET /api/admin/giangvien ─────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const makhoa = searchParams.get("makhoa") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const from = (page - 1) * limit;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let query = supabase
    .from("giangvien")
    .select(
      `magv, hoten, ngaysinh, gioitinh, hocvi, chuyennganh, emailtruong, makhoa,
       khoa(tenkhoa),
       chitietgiangvien(sodienthoai, emailcanhan, ngayvaotruong, hesoluong)`,
      { count: "exact" }
    )
    .order("magv", { ascending: true })
    .range(from, from + limit - 1);

  if (search) query = query.or(`hoten.ilike.%${search}%,magv.ilike.%${search}%`);
  if (makhoa) query = query.eq("makhoa", makhoa);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data,
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
}

// ─── POST /api/admin/giangvien ────────────────────────────────────────────────

export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { magv, makhoa, hoten, ngaysinh, gioitinh, hocvi, chuyennganh, emailtruong, email, matkhau, chiTiet } = body;

  if (!magv?.trim() || !hoten?.trim() || !email?.trim() || !matkhau?.trim())
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Hash mật khẩu bằng hàm PostgreSQL
  const { data: hashed, error: hashErr } = await supabase
    .rpc("hash_password", { password: matkhau });

  if (hashErr) return NextResponse.json({ error: "Lỗi hash mật khẩu." }, { status: 500 });

  // 2. Insert tài khoản với mật khẩu đã hash
  const { data: tk, error: tkErr } = await supabase
    .from("taikhoan")
    .insert({
      mataikhoan: magv.trim(),
      email: email.trim(),
      matkhau: hashed,          // ← chuỗi hash từ DB
      vaitro: "GiangVien",
      trangthai: "HoatDong",
    })
    .select("mataikhoan")
    .single();

  if (tkErr) return NextResponse.json({ error: "Không thể tạo tài khoản: " + tkErr.message }, { status: 400 });

  // 2. Tạo giảng viên
  const { data: gv, error: gvErr } = await supabase
    .from("giangvien")
    .insert({
      magv: magv.trim(),
      makhoa: makhoa || null,
      hoten: hoten.trim(),
      ngaysinh: ngaysinh || null,
      gioitinh: gioitinh || null,
      hocvi: hocvi || null,
      chuyennganh: chuyennganh || null,
      emailtruong: emailtruong || null,
      mataikhoan: tk.mataikhoan,
    })
    .select()
    .single();

  if (gvErr) return NextResponse.json({ error: gvErr.message }, { status: 400 });

  // 3. Chi tiết
  if (chiTiet && Object.keys(chiTiet).length > 0) {
    await supabase.from("chitietgiangvien").insert({ magv: magv.trim(), ...chiTiet });
  }

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "INSERT",
    tentable: "giangvien",
    makhoachinh: magv.trim(),
    giatrimoi: { ...gv, chiTiet },
    request,
  });

  return NextResponse.json({ success: true, data: gv }, { status: 201 });
}