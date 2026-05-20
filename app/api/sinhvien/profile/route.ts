import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

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

    const nameStr = hoten?.trim() || "";
    const parts = nameStr.split(/\s+/);
    const ten = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const hodem = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";

    const { error: svError } = await supabase
      .from("sinhvien")
      .update({
        hodem:       hodem               || null,
        ten:         ten                 || null,
        ngaysinh:    ngaysinh            ?? null,
        gioitinh:    normalizeGioiTinh(gioitinh),
        anhdaidien:  anhdaidien?.trim()  || null,
        quequan:     quequan?.trim()     || null,
        diachi:      diachi?.trim()      || null,
        sodienthoai: sodienthoai?.trim() || null,
        emailcanhan: emailcanhan?.trim() || null,
        tenphuhuynh: tenphuhuynh?.trim() || null,
        sodienthoaiphuhuynh: sodienthoaiphuhuynh?.trim() || null,
        cccd:        cccd?.trim()        || null,
        ngaycapcccd: ngaycapcccd         ?? null,
        noicapcccd:  noicapcccd?.trim()  || null,
        dantoc:      dantoc?.trim()      || null,
        tongiao:     tongiao?.trim()     || null,
        ...(face_embedding !== undefined ? { face_embedding } : {})
      })
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
