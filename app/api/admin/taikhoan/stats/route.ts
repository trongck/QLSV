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

// ─── GET /api/admin/taikhoan/stats Lấy thống kê về tài khoản ───────────────────────────────────────────

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("taikhoan")
    .select("vaitro, trangthai");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const stats = {
    total: data.length,
    admin: data.filter(r => r.vaitro === "Admin").length,
    giangvien: data.filter(r => r.vaitro === "GiangVien").length,
    sinhvien: data.filter(r => r.vaitro === "SinhVien").length,
    hoatdong: data.filter(r => r.trangthai === "HoatDong").length,
    khoa: data.filter(r => r.trangthai === "Khoa").length,
  };

  return NextResponse.json({ success: true, data: stats });
}