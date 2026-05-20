import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!gv) {
      return NextResponse.json({ error: "Không tìm thấy giảng viên" }, { status: 404 });
    }

    const { id } = await params;
    const madethi = Number(id);

    if (isNaN(madethi)) {
      return NextResponse.json({ error: "ID đề thi không hợp lệ" }, { status: 400 });
    }

    const body = await request.json();
    if (body.action === "END_EXAM") {
      await giangVienService.endExam(gv.magv, madethi);
      return NextResponse.json({ success: true, message: "Đã kết thúc ca thi" });
    }

    if (body.action === "UPDATE_TIME") {
      const { thoigianlam, thoigianbatdau, thoigianketthuc } = body;
      if (!thoigianlam || !thoigianbatdau || !thoigianketthuc) {
        return NextResponse.json({ error: "Thiếu thông tin thời gian" }, { status: 400 });
      }
      await giangVienService.updateExamTime(gv.magv, madethi, {
        thoigianlam: Number(thoigianlam),
        thoigianbatdau,
        thoigianketthuc
      });
      return NextResponse.json({ success: true, message: "Cập nhật thời gian thi thành công" });
    }

    return NextResponse.json({ error: "Hành động không được hỗ trợ" }, { status: 400 });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/exams/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật ca thi" },
      { status: 500 }
    );
  }
}
