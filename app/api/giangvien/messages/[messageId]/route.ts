import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function getTeacherPayload(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const payload = await getTeacherPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;
  const id = Number(messageId);
  if (isNaN(id)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());

  // Lấy thông tin tin nhắn hiện tại
  const { data: msg } = await supabase.from("tinnhan").select("nguoidaxoa").eq("matinnhan", id).single();
  const currentArray = msg?.nguoidaxoa || [];
  
  const userId = payload.mataikhoan;
  if (!currentArray.includes(userId)) {
    const { error } = await supabase
      .from("tinnhan")
      .update({ nguoidaxoa: [...currentArray, userId] })
      .eq("matinnhan", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "Ẩn tin nhắn",
    tentable: "tinnhan",
    makhoachinh: String(id),
    request: req,
  });

  return NextResponse.json({ success: true });
}
