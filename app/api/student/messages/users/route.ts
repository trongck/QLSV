import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// ─── GET /api/messages/users ─────────────────────────────────────────────────
// Tìm kiếm sinh viên và giảng viên để bắt đầu cuộc trò chuyện mới

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const limit  = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  if (!search.trim()) {
    return NextResponse.json({ data: [] });
  }

  const supabase = createClient(await cookies());

  // Tìm kiếm sinh viên theo tên HOẶC mã sinh viên
  const { data: svRows, error: svErr } = await supabase
    .from("sinhvien")
    .select("masv, hodem, ten, anhdaidien, emailtruong, lop:malop ( tenlop )")
    .or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,masv.ilike.%${search}%`)
    .limit(limit);

  // Tìm kiếm giảng viên theo tên HOẶC mã giảng viên
  const { data: gvRows, error: gvErr } = await supabase
    .from("giangvien")
    .select("magv, hodem, ten, anhdaidien, emailtruong, khoa:makhoa ( tenkhoa )")
    .or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,magv.ilike.%${search}%`)
    .limit(limit);

  if (svErr || gvErr) {
    return NextResponse.json({ error: (svErr ?? gvErr)?.message }, { status: 500 });
  }

  const students = (svRows ?? []).map((s) => ({
    id:     s.masv,
    masv:   s.masv,
    magv:   null,
    hoten:  [s.hodem, s.ten].filter(Boolean).join(" ") || "Sinh Viên",
    avatar: s.anhdaidien ?? null,
    email:  s.emailtruong ?? null,
    role:   "SinhVien",
    extra:  (s.lop as any)?.tenlop ?? null,
  }));

  const teachers = (gvRows ?? []).map((g) => ({
    id:    g.magv,
    masv:  null,
    magv:  g.magv,
    hoten: [g.hodem, g.ten].filter(Boolean).join(" ") || "Giảng Viên",
    avatar: g.anhdaidien ?? null,
    email:  g.emailtruong ?? null,
    role:   "GiangVien",
    extra:  (g.khoa as any)?.tenkhoa ?? null,
  }));

  return NextResponse.json({ data: [...students, ...teachers] });
}
