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

// ─── POST /api/admin/taikhoan/bulk  sửa lý tác vụ liên quan đến tài khoản ────────────────────────────────────────────
// Body: { ids: string[]; action: "lock" | "unlock" | "reset"; matkhau?: string }

export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { ids, action, matkhau } = body as {
    ids: string[];
    action: "lock" | "unlock" | "reset";
    matkhau?: string;
  };

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: "Danh sách tài khoản không hợp lệ." }, { status: 400 });

  if (ids.length > 100)
    return NextResponse.json({ error: "Tối đa 100 tài khoản mỗi lần." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let update: Record<string, unknown> = {};

  if (action === "lock")   update = { trangthai: "Khoa" };
  if (action === "unlock") update = { trangthai: "HoatDong" };
  if (action === "reset") {
    if (!matkhau || matkhau.trim().length < 6)
      return NextResponse.json({ error: "Mật khẩu mới phải có ít nhất 6 ký tự." }, { status: 400 });

    const { data: hashed, error: hashErr } = await supabase
      .rpc("hash_password", { password: matkhau.trim() });

    if (hashErr || !hashed) {
      return NextResponse.json({ error: "Lỗi mã hoá mật khẩu mới." }, { status: 500 });
    }
    update = { matkhau: hashed };
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });

  const { data, error } = await supabase
    .from("taikhoan")
    .update(update)
    .in("mataikhoan", ids)
    .neq("vaitro", VaiTro.Admin)      // bảo vệ admin
    .select("mataikhoan, email, vaitro, trangthai");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, affected: data?.length ?? 0, data });
}