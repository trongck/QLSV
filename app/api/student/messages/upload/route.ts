import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { messageService } from "@/services/service/sinhvien/message.service";

async function requireAuth(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

export async function POST(req: Request) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Dữ liệu form không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });

  try {
    const result = await messageService.uploadMessageFile(payload.mataikhoan, file, req);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes("giới hạn 10MB") ? 413 : error.message.includes("không được hỗ trợ") ? 415 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
