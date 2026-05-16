import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

async function resolveIds(supabase: any, mataikhoan: string, vaitro: VaiTro) {
  if (vaitro === VaiTro.SinhVien) {
    const { data } = await supabase.from("sinhvien").select("masv").eq("mataikhoan", mataikhoan).single();
    return { masv: data?.masv ?? null, magv: null };
  }
  if (vaitro === VaiTro.GiangVien) {
    const { data } = await supabase.from("giangvien").select("magv").eq("mataikhoan", mataikhoan).single();
    return { masv: null, magv: data?.magv ?? null };
  }
  return { masv: null, magv: null };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  // Lấy thành viên — không dùng FK join phức tạp để tránh lỗi
  const { data: memberRows, error } = await supabase
    .from("thanhvientrochuyen")
    .select("masv, magv, vaitro, ngaythamgia, thoigianxemcuoi")
    .eq("macuoctrochuyen", convId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Lấy hồ sơ sinh viên
  const svIds = (memberRows ?? []).map((m: any) => m.masv).filter(Boolean);
  const gvIds = (memberRows ?? []).map((m: any) => m.magv).filter(Boolean);

  const svMap: Record<string, any> = {};
  const gvMap: Record<string, any> = {};

  if (svIds.length > 0) {
    const { data: svRows } = await supabase
      .from("sinhvien")
      .select("masv, hoten, anhdaidien, emailtruong")
      .in("masv", svIds);
    (svRows ?? []).forEach((s: any) => { svMap[s.masv] = s; });
  }

  if (gvIds.length > 0) {
    const { data: gvRows } = await supabase
      .from("giangvien")
      .select("magv, hoten, anhdaidien, emailtruong")
      .in("magv", gvIds);
    (gvRows ?? []).forEach((g: any) => { gvMap[g.magv] = g; });
  }

  const result = (memberRows ?? []).map((m: any) => ({
    masv: m.masv,
    magv: m.magv,
    vaitro: m.vaitro,
    ngaythamgia: m.ngaythamgia,
    thoigianxemcuoi: m.thoigianxemcuoi,
    sinhvien: m.masv ? (svMap[m.masv] ?? null) : null,
    giangvien: m.magv ? (gvMap[m.magv] ?? null) : null,
    isSelf: (masv && m.masv === masv) || (magv && m.magv === magv),
  }));

  return NextResponse.json({ data: result });
}
