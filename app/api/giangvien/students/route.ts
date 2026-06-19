import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

// GET /api/giangvien/students
// - Trả về danh sách lớp nếu không có maphancong
// - Trả về danh sách sinh viên thực tế nếu có maphancong
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

    const { getSupabaseClient } = await import("@/lib/utils/supabase/server");
    const supabase = await getSupabaseClient();

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

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
      const data = await giangVienService.getRosterStudents(maphancong);
      return NextResponse.json({ success: true, data });
    }

    const classes = await giangVienService.getGradeClasses(gv.magv);
    return NextResponse.json({ success: true, data: classes });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/students:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

// PUT /api/giangvien/students
// - Cập nhật hồ sơ thông tin liên hệ sinh viên
export async function PUT(request: Request) {
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

    const body = await request.json();
    const { masv, name, email, phone, parentName, parentPhone, address } = body;

    if (!masv || !name) {
      return NextResponse.json({ error: "Thiếu thông tin cập nhật bắt buộc" }, { status: 400 });
    }

    await giangVienService.updateRosterStudent(masv, {
      name,
      email: email || "",
      phone: phone || "",
      parentName: parentName || "",
      parentPhone: parentPhone || "",
      address: address || ""
    });

    return NextResponse.json({ success: true, message: "Đã cập nhật hồ sơ sinh viên thành công" });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/students:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật thông tin" },
      { status: 500 }
    );
  }
}
