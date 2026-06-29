import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const maphancong = parseInt(formData.get("maphancong") as string, 10);
    const tieude = formData.get("tieude") as string;
    const file = formData.get("file") as File | null;

    if (isNaN(maphancong) || !tieude.trim() || !file) {
      return NextResponse.json({ error: "Thiếu dữ liệu bắt buộc" }, { status: 400 });
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();

    const data = await giangVienService.createTaiLieu(gv.magv, {
      maphancong,
      tieude,
      fileBuffer,
      fileName,
      contentType: file.type,
      size: file.size,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/classes/documents:", err.message);
    return NextResponse.json({ error: err.message || "Lỗi hệ thống" }, { status: 500 });
  }
}
