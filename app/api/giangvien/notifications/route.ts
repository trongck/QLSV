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

// GET /api/giangvien/notifications
export async function GET(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const loai = searchParams.get("loai") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 15)));

  try {
    const result = await giangVienService.getNotifications(payload.mataikhoan, { search, loai, page, limit });
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/giangvien/notifications
export async function POST(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = await giangVienService.createNotification(payload.mataikhoan, body);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    const status = err.message.includes("không được để trống") ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// PATCH /api/giangvien/notifications
export async function PATCH(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await giangVienService.markNotificationsRead(payload.mataikhoan, body);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message.includes("không hợp lệ") ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
