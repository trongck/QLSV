import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/service/sinhvien/student.service";

/** Validate gioitinh theo đúng CHECK constraint của DB */
function normalizeGioiTinh(val: string | undefined): "Nam" | "Nu" | "Khac" | null {
  if (val === "Nam" || val === "Nu" || val === "Khac") return val;
  if (val === "Nữ") return "Nu";
  if (val === "Khác") return "Khac";
  return null;
}

// ─── GET /api/sinhvien/profile ────────────────────────────────────────────────

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;

    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const data = await sinhVienService.getMyProfile(payload.mataikhoan);
    if (!data) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ sinh viên" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }
}

// ─── PUT /api/sinhvien/profile ────────────────────────────────────────────────

export async function PUT(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      hoten,
      ngaysinh,
      gioitinh,
      anhdaidien,
      quequan,
      diachi,
      sodienthoai,
      emailcanhan,
      tenphuhuynh,
      sodienthoaiphuhuynh,
      cccd,
      ngaycapcccd,
      noicapcccd,
      dantoc,
      tongiao,
      face_embedding,
    } = body;

    // Các trường khóa chính, khóa ngoại như masv, mataikhoan, malop, và trangthai, emailtruong là cố định/chỉ đọc

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const updateData: any = {};
    
    if (face_embedding !== undefined) {
      updateData.face_embedding = face_embedding;
    }

    // Nếu request gửi lên form cập nhật thông tin cá nhân (có trường hoten)
    if ("hoten" in body) {
      const nameStr = hoten?.trim() || "";
      const parts = nameStr.split(/\s+/);
      updateData.ten = parts.length > 1 ? parts[parts.length - 1] : parts[0] || null;
      updateData.hodem = parts.length > 1 ? parts.slice(0, -1).join(" ") || null : null;
      
      updateData.ngaysinh = ngaysinh ?? null;
      updateData.gioitinh = normalizeGioiTinh(gioitinh);
      updateData.anhdaidien = anhdaidien?.trim() || null;
      updateData.quequan = quequan?.trim() || null;
      updateData.diachi = diachi?.trim() || null;
      updateData.sodienthoai = sodienthoai?.trim() || null;
      updateData.emailcanhan = emailcanhan?.trim() || null;
      updateData.tenphuhuynh = tenphuhuynh?.trim() || null;
      updateData.sodienthoaiphuhuynh = sodienthoaiphuhuynh?.trim() || null;
      updateData.cccd = cccd?.trim() || null;
      updateData.ngaycapcccd = ngaycapcccd ?? null;
      updateData.noicapcccd = noicapcccd?.trim() || null;
      updateData.dantoc = dantoc?.trim() || null;
      updateData.tongiao = tongiao?.trim() || null;
    }

    const { error: svError } = await supabase
      .from("sinhvien")
      .update(updateData)
      .eq("mataikhoan", payload.mataikhoan);

    if (svError) {
      console.error("Lỗi cập nhật sinhvien:", svError.message);
      throw svError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lỗi PUT /api/sinhvien/profile:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật hồ sơ" },
      { status: 500 }
    );
  }
}
