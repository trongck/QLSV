import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

// GET /api/giangvien/classes
// Trả về data cho 3 tab của trang Lớp học:
//   dsLop     → Tab "Lớp học phần"
//   lichTuan  → Tab "Lịch dạy học"
//   dsTaiLieu → Tab "Kho bài giảng"

export async function GET(request: Request) {
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

    const data = await giangVienService.getClassesData(gv.magv);

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/classes:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}
