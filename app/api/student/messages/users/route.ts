import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

import { messageService } from "@/services/service/sinhvien/message.service";

// ─── GET /api/messages/users ─────────────────────────────────────────────────
// Tìm kiếm sinh viên và giảng viên để bắt đầu cuộc trò chuyện mới

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? "";
  const limit  = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));

  try {
    const data = await messageService.searchUsers(search, limit);
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
