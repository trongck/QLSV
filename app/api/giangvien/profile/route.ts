import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Map tên khoa hiển thị → mã khoa trong DB */
function mapKhoa(tenkhoa: string | undefined): string | null {
  if (!tenkhoa) return null;
  const map: Record<string, string> = {
    "Khoa Công nghệ thông tin": "CNTT",
    "Khoa Điện tử viễn thông": "DTVT",
    "Khoa Kinh tế và Quản lý": "KTVQL",
    "Khoa Khoa học cơ bản": "KHCB",
  };
  // Nếu giá trị đã là mã (CNTT, DTVT...) thì trả nguyên
  return map[tenkhoa] ?? tenkhoa;
}

/** Validate gioitinh theo đúng CHECK constraint của DB */
function normalizeGioiTinh(val: string | undefined): "Nam" | "Nu" | "Khac" | null {
  if (val === "Nam" || val === "Nu" || val === "Khac") return val;
  // Hỗ trợ frontend gửi "Nữ" hoặc "Khác" (có dấu)
  if (val === "Nữ") return "Nu";
  if (val === "Khác") return "Khac";
  return null;
}

// ─── GET /api/giangvien/profile ────────────────────────────────────────────────

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

    const data = await giangVienService.getMyProfile(payload.mataikhoan);
    if (!data) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ giảng viên" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }
}

// ─── PUT /api/giangvien/profile ────────────────────────────────────────────────
// Cập nhật hồ sơ giảng viên — tất cả trường nằm trong 1 bảng giangvien duy nhất
// (DB đã merge chitietgiangvien vào giangvien)

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
    const {
      hoten,
      email,
      faculty,
      ngaysinh,
      gioitinh,
      hocvi,
      chuyennganh,
      anhdaidien,
      thanhtuu,
      diachi,
      sodienthoai,
      emailcanhan,
    } = body;

    // Các trường ngayvaotruong và hesoluong chỉ đọc — không cho phép tự sửa

    const supabase = await getSupabaseClient();

    // Cập nhật tất cả trong 1 bảng giangvien
    const nameStr = hoten?.trim() || "";
    const parts = nameStr.split(/\s+/);
    const ten = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const hodem = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";

    const { error: gvError } = await supabase
      .from("giangvien")
      .update({
        hodem:       hodem               || null,
        ten:         ten                 || null,
        emailtruong: email?.trim()       ?? null,
        makhoa:      mapKhoa(faculty),
        ngaysinh:    ngaysinh            ?? null,
        gioitinh:    normalizeGioiTinh(gioitinh),
        hocvi:       hocvi?.trim()       || null,
        chuyennganh: chuyennganh?.trim() || null,
        anhdaidien:  anhdaidien?.trim()  || null,
        thanhtuu:    thanhtuu?.trim()    || null,
        diachi:      diachi?.trim()      || null,
        sodienthoai: sodienthoai?.trim() || null,
        emailcanhan: emailcanhan?.trim() || null,
      })
      .eq("mataikhoan", payload.mataikhoan);

    if (gvError) {
      console.error("Lỗi cập nhật giangvien:", gvError.message);
      throw gvError;
    }

    // Đồng bộ email đăng nhập trong bảng taikhoan nếu email thay đổi
    if (email?.trim()) {
      const { error: tkError } = await supabase
        .from("taikhoan")
        .update({ email: email.trim() })
        .eq("mataikhoan", payload.mataikhoan);

      if (tkError) {
        // Không throw — chỉ log, email trường vẫn đã lưu thành công
        console.warn("Cảnh báo: không thể đồng bộ email taikhoan:", tkError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/profile:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật hồ sơ" },
      { status: 500 }
    );
  }
}