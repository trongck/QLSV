import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { changePasswordService } from "@/services/service/auth/auth-server.service";

export async function POST(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const diachiip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    await changePasswordService(supabase, payload.mataikhoan, body, diachiip);

    return NextResponse.json({ success: true, message: "Thay đổi mật khẩu thành công!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ.";
    console.error("[change-password] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
