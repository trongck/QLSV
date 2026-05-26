import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/teacher.service";

// GET /api/giangvien/attendance
// Nếu có query params mabuoihoc & maphancong -> Trả về danh sách chi tiết điểm danh của buổi học.
// Ngược lại -> Trả về tổng quan (danh sách lớp phân công, các buổi học đã có, các đơn xin nghỉ).
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

    // Resolve magv từ mataikhoan
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

    const { searchParams } = new URL(request.url);
    const mabuoihoc = searchParams.get("mabuoihoc");
    const maphancong = searchParams.get("maphancong");

    if (mabuoihoc && maphancong) {
      const list = await giangVienService.getAttendanceList(Number(mabuoihoc), Number(maphancong));
      return NextResponse.json({ success: true, data: list });
    }

    const overview = await giangVienService.getAttendanceOverview(gv.magv);
    return NextResponse.json({ success: true, data: overview });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/attendance:", err.message);
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }
}

// POST /api/giangvien/attendance
// Tạo mới buổi học (ca điểm danh) hoặc Sinh viên điểm danh bằng mã QR định vị
export async function POST(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await verifyToken(token);
    // Cho phép cả giảng viên và sinh viên truy cập endpoint này
    if (payload.vaitro !== VaiTro.GiangVien && payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, maphancong, date, mabuoihoc, qr_secret, lat, lng } = body;

    // Các hành động dành cho Giảng viên:
    if (action === "createSession") {
      if (payload.vaitro !== VaiTro.GiangVien) {
        return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
      }
      const session = await giangVienService.createAttendanceSession(Number(maphancong), date);
      return NextResponse.json({ success: true, data: session });
    }

    if (action === "generateQR") {
      if (payload.vaitro !== VaiTro.GiangVien) {
        return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
      }
      const secret = await giangVienService.generateQRCode(Number(mabuoihoc));
      return NextResponse.json({ success: true, data: { qr_secret: secret } });
    }

    // Hành động dành cho Sinh viên: Điểm danh qua QR kèm định vị GPS
    if (action === "studentCheckin") {
      if (payload.vaitro !== VaiTro.SinhVien) {
        return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
      }

      // Đối với sinh viên, mã sinh viên (masv) chính là payload.mataikhoan trong JWT
      const result = await giangVienService.studentQRCheckin(
        payload.mataikhoan,
        Number(mabuoihoc),
        qr_secret,
        Number(lat),
        Number(lng)
      );

      return NextResponse.json({ 
        success: true, 
        message: "Điểm danh bằng QR thành công!", 
        data: result 
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/attendance:", err.message);
    return NextResponse.json({ error: err.message || "Lỗi xử lý yêu cầu" }, { status: 500 });
  }
}

// PUT /api/giangvien/attendance
// Cập nhật điểm danh sinh viên hoặc duyệt/từ chối đơn xin nghỉ học
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
    // Resolve magv từ mataikhoan
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

    const body = await request.json();
    const { action, mabuoihoc, masv, status, ghichu, madon } = body;

    if (action === "updateAttendance") {
      await giangVienService.updateStudentAttendance(Number(mabuoihoc), masv, status, ghichu);
      return NextResponse.json({ success: true, message: "Cập nhật điểm danh thành công" });
    }

    if (action === "updateLeave") {
      await giangVienService.updateLeaveRequest(Number(madon), status, gv.magv);
      return NextResponse.json({ success: true, message: "Duyệt phép vắng thành công" });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    console.error("Lỗi PUT /api/giangvien/attendance:", err.message);
    return NextResponse.json({ error: err.message || "Lỗi xử lý yêu cầu" }, { status: 500 });
  }
}
