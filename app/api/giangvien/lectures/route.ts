import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

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

    // Get lectures for this teacher
    const { data: lectures, error } = await supabase
      .from("baigiang")
      .select("*, monhoc(tenmon)")
      .eq("magv", gv.magv)
      .order("thoigiantao", { ascending: false });

    if (error) {
      // If table doesn't exist yet, return empty array gracefully
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: lectures });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/lectures:", err.message);
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
    payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
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
    const file = formData.get("file") as File;
    const tieude = formData.get("tieude") as string;
    const mota = (formData.get("mota") as string) || "";
    const mamon = formData.get("mamon") as string;

    if (!file || !tieude || !mamon) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const loai_file = isVideo ? "video" : isImage ? "image" : "document";

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${gv.magv}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("lectures")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: `Lỗi Storage: ${uploadError.message || JSON.stringify(uploadError)}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from("lectures")
      .getPublicUrl(fileName);

    // Insert into database
    const { data: insertData, error: insertError } = await supabase
      .from("baigiang")
      .insert({
        magv: gv.magv,
        mamon,
        tieude,
        mota,
        loai_file,
        file_url: publicUrlData.publicUrl,
        dungluong: file.size
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB Insert error:", insertError);
      // Attempt rollback file
      await supabase.storage.from("lectures").remove([fileName]);
      return NextResponse.json({ error: `Lỗi Database: ${insertError.message || JSON.stringify(insertError)}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: insertData });

  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/lectures:", err);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải lên bài giảng" },
      { status: 500 }
    );
  }
}
