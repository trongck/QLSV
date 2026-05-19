import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

// Helper to authenticate teacher and return magv
async function authenticateTeacher(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    throw new Error("Chưa cung cấp token");
  }

  const payload = await verifyToken(token) as any;
  if (payload.vaitro !== VaiTro.GiangVien) {
    throw new Error("Không có quyền truy cập");
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
    throw new Error("Không tìm thấy giảng viên");
  }

  return gv.magv;
}

// GET /api/giangvien/tasks
// Lấy danh sách bài tập của giảng viên
export async function GET(request: Request) {
  try {
    const magv = await authenticateTeacher(request);
    const data = await giangVienService.getAssignments(magv);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/tasks:", err.message);
    const status = err.message.includes("token") || err.message.includes("hết hạn") ? 401 : 403;
    return NextResponse.json({ error: err.message }, { status });
  }
}

// POST /api/giangvien/tasks
// Tạo bài tập mới
export async function POST(request: Request) {
  try {
    const magv = await authenticateTeacher(request);
    const body = await request.json();

    if (!body.maphancong || !body.tieude || !body.hannop) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc (maphancong, tieude, hannop)" }, { status: 400 });
    }

    const data = await giangVienService.createAssignment(magv, {
      maphancong: Number(body.maphancong),
      tieude: body.tieude,
      mota: body.mota ?? null,
      filedinh: body.filedinh ?? null,
      hannop: body.hannop,
      diemtoida: body.diemtoida !== undefined ? Number(body.diemtoida) : 10.0,
      loai: body.loai ?? "Baitap"
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/tasks:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/giangvien/tasks
// Cập nhật bài tập
export async function PUT(request: Request) {
  try {
    const magv = await authenticateTeacher(request);
    const body = await request.json();
    
    // Check both query param and body for mabaitap
    const url = new URL(request.url);
    const mabaitapStr = url.searchParams.get("mabaitap") || body.mabaitap;
    
    if (!mabaitapStr) {
      return NextResponse.json({ error: "Thiếu mã bài tập (mabaitap)" }, { status: 400 });
    }

    const mabaitap = Number(mabaitapStr);
    const updateData: any = {};
    if (body.tieude !== undefined) updateData.tieude = body.tieude;
    if (body.mota !== undefined) updateData.mota = body.mota;
    if (body.filedinh !== undefined) updateData.filedinh = body.filedinh;
    if (body.hannop !== undefined) updateData.hannop = body.hannop;
    if (body.diemtoida !== undefined) updateData.diemtoida = Number(body.diemtoida);
    if (body.loai !== undefined) updateData.loai = body.loai;

    const data = await giangVienService.updateAssignment(mabaitap, magv, updateData);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/tasks:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/giangvien/tasks
// Xóa bài tập
export async function DELETE(request: Request) {
  try {
    const magv = await authenticateTeacher(request);
    
    // Check query param first, then body if it exists
    const url = new URL(request.url);
    let mabaitapStr = url.searchParams.get("mabaitap");
    
    if (!mabaitapStr) {
      try {
        const body = await request.json();
        mabaitapStr = body.mabaitap;
      } catch {}
    }

    if (!mabaitapStr) {
      return NextResponse.json({ error: "Thiếu mã bài tập (mabaitap)" }, { status: 400 });
    }

    const mabaitap = Number(mabaitapStr);
    await giangVienService.deleteAssignment(mabaitap, magv);
    
    return NextResponse.json({ success: true, message: "Đã xóa bài tập thành công." });
  } catch (err: any) {
    console.error("Lỗi DELETE /api/giangvien/tasks:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
