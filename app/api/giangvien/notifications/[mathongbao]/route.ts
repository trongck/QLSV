import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

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

// PATCH /api/giangvien/notifications/[mathongbao]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await giangVienService.updateNotification(payload.mataikhoan, id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 :
                   err.message.includes("không có quyền") ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// DELETE /api/giangvien/notifications/[mathongbao]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ" }, { status: 400 });
  }

  try {
    await giangVienService.deleteNotification(payload.mataikhoan, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message.includes("Không tìm thấy") ? 404 :
                   err.message.includes("không có quyền") ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
