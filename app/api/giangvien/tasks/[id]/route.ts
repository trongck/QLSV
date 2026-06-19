import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { id } = await params;
    const mabaitap = parseInt(id, 10);
    if (isNaN(mabaitap)) {
      return NextResponse.json({ error: "ID bài tập không hợp lệ" }, { status: 400 });
    }

    const data = await giangVienService.getTaskSubmissions(mabaitap);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/tasks/[id]:", err.message);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}

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

    const formData = await request.formData();
    const tieude = formData.get("title") as string;
    const mota = formData.get("description") as string;
    const hannop = formData.get("isoDate") as string;
    const file = formData.get("file") as File | null;

    let filedinhUrl = undefined;
    if (file && file.size > 0) {
      const { getSupabaseClient } = await import("@/lib/utils/supabase/server");
    const supabase = await getSupabaseClient();

      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const fileName = `task_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      const fileBuffer = await file.arrayBuffer();
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json({ error: "Lỗi khi upload file đính kèm" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(fileName);
        
      filedinhUrl = publicUrlData.publicUrl;
    }

    const updateData: any = {
      tieude,
      mota,
      hannop
    };
    
    if (filedinhUrl) {
      updateData.filedinh = filedinhUrl;
    }

    await giangVienService.updateTask(mabaitap, updateData);

    return NextResponse.json({ success: true, message: "Cập nhật thành công" });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/tasks/[id]:", err.message);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật bài tập" },
      { status: 500 }
    );
  }
}
