import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
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

  // Lấy danh sách thành viên theo mataikhoan
  const { data: memberRows, error } = await supabase
    .from("thanhvientrochuyen")
    .select(`
      mataikhoan, 
      vaitro, 
      ngaythamgia, 
      thoigianxemcuoi,
      taikhoan (
        email,
        vaitro,
        sinhvien (masv, hoten, anhdaidien, emailtruong),
        giangvien (magv, hoten, anhdaidien, emailtruong),
        admin (maadmin, hoten)
      )
    `)
    .eq("macuoctrochuyen", convId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (memberRows ?? []).map((m: any) => {
    // Extract related nested profile
    let profile: any = null;
    const role = m.taikhoan?.vaitro;
    if (role === 'SinhVien' && m.taikhoan?.sinhvien?.[0]) {
        profile = m.taikhoan.sinhvien[0];
    } else if (role === 'GiangVien' && m.taikhoan?.giangvien?.[0]) {
        profile = m.taikhoan.giangvien[0];
    } else if (role === 'Admin' && m.taikhoan?.admin?.[0]) {
        profile = m.taikhoan.admin[0];
    }

    return {
      mataikhoan: m.mataikhoan,
      vaitro: m.vaitro, // Vai trò trong nhóm (VD: QuanTri, ThanhVien)
      ngaythamgia: m.ngaythamgia,
      thoigianxemcuoi: m.thoigianxemcuoi,
      taikhoan: {
         email: m.taikhoan?.email,
         vaitro: m.taikhoan?.vaitro,
         hoten: profile?.hoten,
         anhdaidien: profile?.anhdaidien,
         id_phu: profile?.masv || profile?.magv || profile?.maadmin, // optional ID context
      },
      isSelf: m.mataikhoan === payload.mataikhoan,
    };
  });

  return NextResponse.json({ data: result });
}
