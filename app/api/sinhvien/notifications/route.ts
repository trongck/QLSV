import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

// GET /api/sinhvien/notifications — Danh sách thông báo (kèm trạng thái đã đọc)
// PUT /api/sinhvien/notifications — Đánh dấu thông báo đã đọc

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

    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: sv } = await supabase
      .from("sinhvien")
      .select("masv, malop")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!sv) {
      return NextResponse.json({ error: "Không tìm thấy sinh viên" }, { status: 404 });
    }

    const data = await sinhVienService.getNotifications(sv.masv, sv.malop);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/notifications:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

export async function PUT(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.SinhVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    const { createClient } = await import("@/lib/utils/supabase/server");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: sv } = await supabase
      .from("sinhvien")
      .select("masv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!sv) {
      return NextResponse.json({ error: "Không tìm thấy sinh viên" }, { status: 404 });
    }

    const body = await request.json();
    const { mathongbao } = body;

    if (!mathongbao) {
      return NextResponse.json({ error: "Thiếu mã thông báo" }, { status: 400 });
    }

    await sinhVienService.markNotificationRead(sv.masv, Number(mathongbao));
    return NextResponse.json({ success: true, message: "Đánh dấu đã đọc thành công" });
  } catch (err: any) {
    console.error("Lỗi PUT /api/sinhvien/notifications:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
