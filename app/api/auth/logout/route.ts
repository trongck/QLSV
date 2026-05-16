import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { logAuditAction } from "@/lib/utils/audit";

// DELETE /api/auth/logout
// Body: { refreshToken: string }
export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { refreshToken } = body;

    if (refreshToken) {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

      // Xóa phiên khỏi DB
      await supabase.from("phiendangnhap").delete().eq("refreshtoken", refreshToken);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/auth/logout/all — thu hồi tất cả phiên của tài khoản
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mataikhoan } = body;

    if (!mataikhoan) {
      return NextResponse.json({ error: "Thiếu mataikhoan." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    await supabase.from("phiendangnhap").delete().eq("mataikhoan", mataikhoan);

    await logAuditAction({
      supabase,
      mataikhoan,
      hanhdong: "LOGOUT_ALL",
      tentable: "phiendangnhap",
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
