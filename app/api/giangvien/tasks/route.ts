import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

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

    // Lấy magv từ mataikhoan
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

    const tasks = await giangVienService.getTasks(gv.magv);

    return NextResponse.json({ success: true, data: tasks });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/tasks:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

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

    const formData = await request.formData();
    const maphancong = formData.get("maphancong") as string;
    const tieude = formData.get("tieude") as string;
    const mota = formData.get("mota") as string;
    const hannop = formData.get("hannop") as string;
    const file = formData.get("file") as File | null;

    if (!maphancong || !tieude || !hannop) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    let filedinhUrl = "";
    if (file && file.size > 0) {
      const { createClient } = await import("@/lib/utils/supabase/server");
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);

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

    const newTask = await giangVienService.createTask(gv.magv, {
      maphancong: Number(maphancong),
      tieude,
      mota: mota || "",
      hannop,
      filedinh: filedinhUrl || undefined
    });

    return NextResponse.json({ success: true, data: newTask, message: "Tạo bài tập thành công" });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/tasks:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo bài tập" },
      { status: 500 }
    );
  }
}
