import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

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

    const { id } = await params;
    const matailieu = Number(id);

    if (isNaN(matailieu)) {
      return NextResponse.json({ error: "ID báo cáo không hợp lệ" }, { status: 400 });
    }

    const { mota, tieude } = await request.json();

    if (mota === undefined && tieude === undefined) {
      return NextResponse.json({ error: "Thiếu nội dung cần cập nhật (tieude hoặc mota)" }, { status: 400 });
    }

    await giangVienService.updateReport(gv.magv, matailieu, { tieude, mota });

    return NextResponse.json({ success: true, message: "Cập nhật báo cáo thành công" });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/reports/[id]:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật nhận xét báo cáo" },
      { status: 500 }
    );
  }
}
