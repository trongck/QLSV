import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { messageService } from "@/services/service/sinhvien/message.service";

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await messageService.getConversations(payload.mataikhoan);
    return NextResponse.json({ data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { otherMataikhoan } = body;

    const { data: convData, existed } = await messageService.createConversation(
      payload.mataikhoan,
      otherMataikhoan,
      request
    );

    return NextResponse.json({ data: convData, existed }, { status: existed ? 200 : 201 });
  } catch (error: any) {
    console.error("CreateConversation API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
