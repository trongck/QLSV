import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import type { UserProfile } from "@/models";

// GET /api/auth/me  — xác thực access token từ Authorization header
export async function GET(request: Request) {
  try {
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Xác thực JWT
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Kiểm tra tài khoản vẫn còn hoạt động
    const { data: taikhoan } = await supabase
      .from("taikhoan")
      .select("mataikhoan, email, vaitro, trangthai")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!taikhoan || taikhoan.trangthai === "Khoa") {
      return NextResponse.json({ error: "Tài khoản không hợp lệ hoặc đã bị khóa." }, { status: 403 });
    }

    // Lấy profile đầy đủ
    const userProfile = await fetchProfile(supabase, taikhoan.mataikhoan, taikhoan.email, taikhoan.vaitro);

    return NextResponse.json({ user: userProfile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProfile(supabase: any, mataikhoan: string, email: string, vaitro: string): Promise<UserProfile> {
  let hoten = "";
  let anhdaidien: string | null = null;
  let maSinhVien: string | undefined;
  let maGiangVien: string | undefined;
  let maAdmin: string | undefined;

  if (vaitro === VaiTro.SinhVien) {
    const { data: sv } = await supabase
      .from("sinhvien")
      .select("masv, hoten, anhdaidien")
      .eq("mataikhoan", mataikhoan)
      .single();
    hoten = sv?.hoten ?? "Sinh Viên";
    anhdaidien = sv?.anhdaidien ?? null;
    maSinhVien = sv?.masv;
  } else if (vaitro === VaiTro.GiangVien) {
    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv, hoten, anhdaidien")
      .eq("mataikhoan", mataikhoan)
      .single();
    hoten = gv?.hoten ?? "Giảng Viên";
    anhdaidien = gv?.anhdaidien ?? null;
    maGiangVien = gv?.magv;
  } else if (vaitro === VaiTro.Admin) {
    const { data: admin } = await supabase
      .from("admin")
      .select("maadmin, hoten")
      .eq("mataikhoan", mataikhoan)
      .single();
    hoten = admin?.hoten ?? "Admin";
    maAdmin = admin?.maadmin;
  }

  return { mataikhoan, email, vaitro: vaitro as VaiTro, hoten, anhdaidien, maSinhVien, maGiangVien, maAdmin };
}
