import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

export async function DELETE(
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
      return NextResponse.json(
        { error: "Không có quyền truy cập" },
        { status: 403 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 },
    );
  }

  try {
    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: gv, error: gvErr } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (gvErr || !gv) {
      return NextResponse.json(
        { error: "Không tìm thấy giảng viên" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const mabaigiang = Number(id);

    // Get the lecture to verify ownership and get file URL
    const { data: lecture, error: getErr } = await supabase
      .from("baigiang")
      .select("*")
      .eq("mabaigiang", mabaigiang)
      .eq("magv", gv.magv)
      .single();

    if (getErr || !lecture) {
      return NextResponse.json(
        { error: "Không tìm thấy bài giảng hoặc không có quyền xóa" },
        { status: 404 },
      );
    }

    // Extract filename from the public URL
    // Public URL format: https://[project_id].supabase.co/storage/v1/object/public/lectures/filename.ext
    let fileName = null;
    try {
      const urlParts = lecture.file_url.split('/lectures/');
      if (urlParts.length > 1) {
        fileName = urlParts[1].split('?')[0]; // Remove query params if any
      }
    } catch (e) {
      console.warn("Could not parse filename from URL:", lecture.file_url);
    }

    // First delete from storage
    if (fileName) {
      const { error: storageErr } = await supabase
        .storage
        .from("lectures")
        .remove([fileName]);
      
      if (storageErr) {
        console.error("Storage delete error:", storageErr);
        // Continue anyway to delete from DB
      }
    }

    // Delete from database
    const { error: delErr } = await supabase
      .from("baigiang")
      .delete()
      .eq("mabaigiang", mabaigiang);

    if (delErr) {
      return NextResponse.json(
        { error: "Lỗi khi xóa bài giảng khỏi CSDL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: "Xóa thành công" });
  } catch (err: any) {
    console.error("Lỗi DELETE /api/giangvien/lectures/[id]:", err);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi xóa bài giảng" },
      { status: 500 },
    );
  }
}
