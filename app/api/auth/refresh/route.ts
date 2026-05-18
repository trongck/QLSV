import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiresAt,
} from "@/lib/utils/jwt";

// POST /api/auth/refresh
// Body: { refreshToken: string }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "Thiếu refresh token." }, { status: 400 });
    }

    // 1. Xác thực refresh token
    let payload;
    try {
      payload = await verifyToken(refreshToken);
    } catch {
      return NextResponse.json({ error: "Refresh token không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 2. Kiểm tra refresh token còn trong DB (chưa bị thu hồi)
    const { data: phien } = await supabase
      .from("phiendangnhap")
      .select("maphien, mataikhoan, thoigianhethan")
      .eq("refreshtoken", refreshToken)
      .single();

    if (!phien) {
      return NextResponse.json({ error: "Phiên đăng nhập không tồn tại hoặc đã bị thu hồi." }, { status: 401 });
    }

    // Kiểm tra hết hạn trong DB
    if (new Date(phien.thoigianhethan) < new Date()) {
      // Dọn phiên cũ
      await supabase.from("phiendangnhap").delete().eq("maphien", phien.maphien);
      return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
    }

    // 3. Kiểm tra tài khoản vẫn còn hoạt động
    const { data: taikhoan } = await supabase
      .from("taikhoan")
      .select("mataikhoan, email, vaitro, trangthai")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!taikhoan || taikhoan.trangthai === "Khoa") {
      return NextResponse.json({ error: "Tài khoản không hợp lệ hoặc đã bị khóa." }, { status: 403 });
    }

    // 4. Xoay token (Refresh Token Rotation)
    const jwtPayload = {
      mataikhoan: taikhoan.mataikhoan,
      email: taikhoan.email,
      vaitro: taikhoan.vaitro,
    };
    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(jwtPayload),
      signRefreshToken(jwtPayload),
    ]);

    // 5. Cập nhật refresh token mới trong DB (xoay token)
    const diachiip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;
    await supabase
      .from("phiendangnhap")
      .update({
        refreshtoken: newRefreshToken,
        diachiip,
        thoigianhethan: refreshTokenExpiresAt().toISOString(),
      })
      .eq("maphien", phien.maphien);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
