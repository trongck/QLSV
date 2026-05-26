import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function getTeacherPayload(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const payload = await getTeacherPayload(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const limit  = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  if (!search.trim()) {
    return NextResponse.json({ data: [] });
  }

  const supabase = await getSupabaseClient();

  // Tìm sinh viên (bằng mã sinh viên hoặc tên)
  const { data: svRows, error: svErr } = await supabase
    .from("sinhvien")
    .select("masv, mataikhoan, hodem, ten, anhdaidien, emailtruong, lop:malop ( tenlop )")
    .or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,masv.ilike.%${search}%`)
    .limit(limit);

  // Tìm giảng viên (bằng mã giảng viên hoặc tên)
  const { data: gvRows, error: gvErr } = await supabase
    .from("giangvien")
    .select("magv, mataikhoan, hodem, ten, anhdaidien, emailtruong, khoa:makhoa ( tenkhoa )")
    .or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,magv.ilike.%${search}%`)
    .limit(limit);

  if (svErr || gvErr) {
    return NextResponse.json({ error: (svErr ?? gvErr)?.message }, { status: 500 });
  }

  const students = (svRows ?? [])
    .filter((s) => s.mataikhoan !== payload.mataikhoan) // loại bỏ bản thân
    .map((s) => ({
      id:     s.masv,
      mataikhoan: s.mataikhoan,
      masv:   s.masv,
      magv:   null,
      hoten:  `${s.hodem || ""} ${s.ten || ""}`.trim() || "Sinh Viên",
      avatar: s.anhdaidien ?? null,
      email:  s.emailtruong ?? null,
      role:   "SinhVien",
      extra:  (s.lop as any)?.tenlop ?? null,
    }));

  const teachers = (gvRows ?? [])
    .filter((g) => g.mataikhoan !== payload.mataikhoan) // loại bỏ bản thân
    .map((g) => ({
      id:    g.magv,
      mataikhoan: g.mataikhoan,
      masv:  null,
      magv:  g.magv,
      hoten: `${g.hodem || ""} ${g.ten || ""}`.trim() || "Giảng Viên",
      avatar: g.anhdaidien ?? null,
      email:  g.emailtruong ?? null,
      role:   "GiangVien",
      extra:  (g.khoa as any)?.tenkhoa ?? null,
    }));

  return NextResponse.json({ data: [...students, ...teachers] });
}
