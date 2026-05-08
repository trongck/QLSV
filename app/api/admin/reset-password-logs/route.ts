import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

export async function GET(request: Request) {
  try {
    // 1. Xác thực — Chỉ Admin mới được truy cập
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    if (payload.vaitro !== VaiTro.Admin) {
      return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 2. Truy vấn nhật ký liên quan đến thay đổi mật khẩu hoặc cấp lại mật khẩu
    const { data: logs, error: logsError } = await supabase
      .from("nhatkyhethong")
      .select(`
        manhatky,
        mataikhoan,
        hanhdong,
        tentable,
        makhoachinh,
        diachiip,
        ngaytao
      `)
      .or("hanhdong.ilike.%cấp lại mật khẩu%,hanhdong.ilike.%thay đổi mật khẩu%")
      .order("ngaytao", { ascending: false })
      .limit(100);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
