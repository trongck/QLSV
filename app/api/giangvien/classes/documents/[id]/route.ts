import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const gv = await giangVienService.getMyProfile(payload.mataikhoan);
    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const matailieu = parseInt(id, 10);
    if (isNaN(matailieu)) {
      return NextResponse.json({ error: "ID tài liệu không hợp lệ" }, { status: 400 });
    }

    await giangVienService.deleteTaiLieu(gv.magv, matailieu);
    return NextResponse.json({ success: true, message: "Xóa tài liệu thành công" });
  } catch (err: any) {
    console.error("Lỗi DELETE /api/giangvien/classes/documents/[id]:", err.message);
    return NextResponse.json({ error: err.message || "Lỗi hệ thống" }, { status: 500 });
  }
}
