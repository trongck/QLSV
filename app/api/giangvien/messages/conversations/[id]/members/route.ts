import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getTeacherPayload(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());

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
        sinhvien (masv, hodem, ten, anhdaidien, emailtruong),
        giangvien (magv, hodem, ten, anhdaidien, emailtruong),
        admin (maadmin, hoten)
      )
    `)
    .eq("macuoctrochuyen", convId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (memberRows ?? []).map((m: any) => {
    let displayName = m.mataikhoan;
    let avatar = null;
    let secondaryId = "";
    const role = m.taikhoan?.vaitro;

    const rawSv = m.taikhoan?.sinhvien;
    const sv = Array.isArray(rawSv) ? rawSv[0] : rawSv;

    const rawGv = m.taikhoan?.giangvien;
    const gv = Array.isArray(rawGv) ? rawGv[0] : rawGv;

    const rawAdm = m.taikhoan?.admin;
    const adm = Array.isArray(rawAdm) ? rawAdm[0] : rawAdm;

    if (role === VaiTro.SinhVien && sv) {
      displayName = `${sv.hodem || ""} ${sv.ten || ""}`.trim() || "Sinh viên";
      avatar = sv.anhdaidien;
      secondaryId = sv.masv;
    } else if (role === VaiTro.GiangVien && gv) {
      displayName = `${gv.hodem || ""} ${gv.ten || ""}`.trim() || "Giảng viên";
      avatar = gv.anhdaidien;
      secondaryId = gv.magv;
    } else if (role === VaiTro.Admin && adm) {
      displayName = adm.hoten || "Quản trị viên";
      secondaryId = adm.maadmin;
    }

    return {
      mataikhoan: m.mataikhoan,
      vaitro: m.vaitro,
      ngaythamgia: m.ngaythamgia,
      thoigianxemcuoi: m.thoigianxemcuoi,
      taikhoan: {
         email: m.taikhoan?.email,
         vaitro: m.taikhoan?.vaitro,
         hoten: displayName,
         anhdaidien: avatar,
         id_phu: secondaryId,
      },
      isSelf: m.mataikhoan === payload.mataikhoan,
    };
  });

  return NextResponse.json({ data: result });
}
