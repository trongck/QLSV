import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { signAccessToken, signRefreshToken, refreshTokenExpiresAt } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import type { UserProfile } from "@/models";

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body?.email?.trim() || !body?.matkhau?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin." },
        { status: 400 }
      );
    }
//


    const { email, matkhau } = body as { email: string; matkhau: string };

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Tìm tài khoản theo email HOẶC mã tài khoản
    const { data: taikhoan, error: tkError } = await supabase
      .from("taikhoan")
      .select("mataikhoan, email, vaitro, trangthai, matkhau")
      .or(`email.eq.${email.trim()},mataikhoan.eq.${email.trim()}`)
      .single();

    if (tkError || !taikhoan) {
      return NextResponse.json(
        { error: "Không tìm thấy tài khoản hoặc sai mã/email." },
        { status: 404 }
      );
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (taikhoan.trangthai === "Khoa") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa." },
        { status: 403 }
      );
    }

    // 3. Xác thực mật khẩu qua hàm verify_password (bcrypt/pgcrypto)
    //    Khớp với: CREATE FUNCTION verify_password(input_password, hashed_password) RETURNS BOOLEAN
    const { data: isMatch, error: verifyError } = await supabase.rpc("verify_password", {
      input_password: matkhau,
      hashed_password: taikhoan.matkhau,
    });

    if (verifyError) {
      console.error("[login] verify_password RPC error:", verifyError.message);
      return NextResponse.json(
        { error: "Lỗi xác thực mật khẩu. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Sai mật khẩu. Vui lòng thử lại." },
        { status: 401 }
      );
    }

    // 4. Lấy profile đầy đủ theo vai trò
    const userProfile = await fetchProfile(
      supabase,
      taikhoan.mataikhoan,
      taikhoan.email,
      taikhoan.vaitro
    );

    // 5. Ký JWT (access + refresh)
    const jwtPayload = {
      mataikhoan: taikhoan.mataikhoan,
      email: taikhoan.email,
      vaitro: taikhoan.vaitro as VaiTro,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(jwtPayload),
      signRefreshToken(jwtPayload),
    ]);

    // 6. Lưu phiên vào bảng phiendangnhap
    const diachiip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      null;

    await supabase.from("phiendangnhap").insert({
      mataikhoan: taikhoan.mataikhoan,
      refreshtoken: refreshToken,
      diachiip,
      thoigianhethan: refreshTokenExpiresAt().toISOString(),
    });

    // 7. Cập nhật dangnhaplancuoi
    await supabase
      .from("taikhoan")
      .update({ dangnhaplancuoi: new Date().toISOString() })
      .eq("mataikhoan", taikhoan.mataikhoan);

    return NextResponse.json({ accessToken, refreshToken, user: userProfile });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ.";
    console.error("[login] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helper: lấy profile theo vai trò ────────────────────────────────────────

async function fetchProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  mataikhoan: string,
  email: string,
  vaitro: string
): Promise<UserProfile> {
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

  return {
    mataikhoan,
    email,
    vaitro: vaitro as VaiTro,
    hoten,
    anhdaidien,
    maSinhVien,
    maGiangVien,
    maAdmin,
  };
}