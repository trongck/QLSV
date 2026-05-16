import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function requireAuth(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

async function resolveIds(supabase: any, mataikhoan: string, vaitro: VaiTro) {
  if (vaitro === VaiTro.SinhVien) {
    const { data } = await supabase.from("sinhvien").select("masv").eq("mataikhoan", mataikhoan).single();
    return { masv: data?.masv ?? null, magv: null };
  }
  if (vaitro === VaiTro.GiangVien) {
    const { data } = await supabase.from("giangvien").select("magv").eq("mataikhoan", mataikhoan).single();
    return { masv: null, magv: data?.magv ?? null };
  }
  return { masv: null, magv: null };
}

export async function DELETE(req: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;
  const id = Number(messageId);
  if (isNaN(id)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  const userId = masv ?? magv;
  if (!userId) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  // Update deleted state based on user role
  const { data: msg } = await supabase.from("tinnhan").select("nguoidaxoa").eq("matinnhan", id).single();
  const currentArray = msg?.nguoidaxoa || [];
  
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
    hanhdong: "Xóa tin nhắn (ẩn với user)",
    tentable: "tinnhan",
    makhoachinh: String(id),
    request: req,
  });

  return NextResponse.json({ success: true });
}
