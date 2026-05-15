import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireStudent(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.SinhVien ? payload : null;
  } catch {
    return null;
  }
}

// ─── GET /api/student/diary ───────────────────────────────────────────────────
// Trả về danh sách nhật ký của sinh viên đang đăng nhập.
// Query params:
//   search  - tìm theo tiêu đề / nội dung
//   page    - trang (default 1)
//   limit   - số bản ghi mỗi trang (default 20, max 50)

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());

  // Lấy masv theo tài khoản
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json(
      { error: "Không tìm thấy thông tin sinh viên." },
      { status: 404 }
    );
  }

  const { masv } = svData;

  // Query nhật ký của sinh viên này
  let query = supabase
    .from("nhatky")
    .select("*", { count: "exact" })
    .eq("masv", masv)
    .order("ngaycapnhat", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `tieude.ilike.%${search}%,noidung.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    masv,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

// ─── POST /api/student/diary ──────────────────────────────────────────────────
// Tạo nhật ký mới. Body JSON: { tieude?, noidung, tamtrang?, maphancong? }

export async function POST(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const { tieude, noidung, tamtrang, maphancong } = body;

  const supabase = createClient(await cookies());

  // Lấy masv
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json({ error: "Không tìm thấy thông tin sinh viên." }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("nhatky")
    .insert({
      masv: svData.masv,
      magv: null,
      tieude: tieude?.trim() || null,
      noidung: (typeof noidung === "string" ? noidung.trim() : ""),
      tamtrang: tamtrang ?? null,
      maphancong: maphancong ?? null,
      ngaytao: now,
      ngaycapnhat: now,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
