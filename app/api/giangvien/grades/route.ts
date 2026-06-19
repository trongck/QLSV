import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

// GET /api/giangvien/grades
// - Trả về ds lớp phân công nếu không truyền maphancong
// - Trả về bảng điểm chi tiết của lớp đó nếu truyền maphancong
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

    const { searchParams } = new URL(request.url);
    const maphancongStr = searchParams.get("maphancong");

    if (maphancongStr) {
      const maphancong = Number(maphancongStr);
      if (isNaN(maphancong)) {
        return NextResponse.json({ error: "Mã phân công không hợp lệ" }, { status: 400 });
      }
      const data = await giangVienService.getGradeSheet(maphancong);
      return NextResponse.json({ success: true, data });
    }

    const classes = await giangVienService.getGradeClasses(gv.magv);
    return NextResponse.json({ success: true, data: classes });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/grades:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

// POST /api/giangvien/grades
// - Nhập/cập nhật điểm cho sinh viên
export async function POST(request: Request) {
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
    const gv = await giangVienService.getMyProfile(payload.mataikhoan);

    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const body = await request.json();
    const { maphancong, masv, grades } = body; // grades: array of { loaidiem, giatri, heso }

    if (!maphancong || !masv || !Array.isArray(grades)) {
      return NextResponse.json({ error: "Thiếu thông tin nhập điểm bắt buộc" }, { status: 400 });
    }

    await giangVienService.saveGradeRow(gv.magv, Number(maphancong), masv, grades);

    return NextResponse.json({ success: true, message: "Đã lưu và cập nhật điểm thành công" });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/grades:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi lưu điểm" },
      { status: 500 }
    );
  }
}
