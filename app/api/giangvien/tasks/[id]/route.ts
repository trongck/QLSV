import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {

    const { id } = await params;
    const mabaitap = parseInt(id, 10);
    if (isNaN(mabaitap)) {
      return NextResponse.json({ error: "ID bài tập không hợp lệ" }, { status: 400 });
    }

    const body = await request.json();
    await giangVienService.updateTask(mabaitap, body);

    return NextResponse.json({ success: true, message: "Cập nhật thành công" });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/tasks/[id]:", err.message);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật bài tập" },
      { status: 500 }
    );
  }
}
