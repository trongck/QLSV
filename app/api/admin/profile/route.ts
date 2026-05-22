import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { getCurrentUserService } from "@/services/service/auth/auth-server.service";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Xác thực và trích xuất thông tin tài khoản admin
    const userProfile = await getCurrentUserService(supabase, authHeader);
    if (!userProfile?.mataikhoan) {
      return NextResponse.json({ error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn." }, { status: 401 });
    }

    // 2. Lấy dữ liệu hồ sơ từ bảng 'admin'
    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .eq("mataikhoan", userProfile.mataikhoan)
      .single();

    if (error || !admin) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ chi tiết của Admin này." }, { status: 404 });
    }

    // 3. Kết hợp thông tin hồ sơ và tài khoản
    return NextResponse.json({
      success: true,
      data: {
        ...admin,
        email: userProfile.email,
        vaitro: userProfile.vaitro
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Lỗi máy chủ nội bộ." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Xác thực người dùng hiện tại
    const userProfile = await getCurrentUserService(supabase, authHeader);
    if (!userProfile?.mataikhoan) {
      return NextResponse.json({ error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn." }, { status: 401 });
    }

    // 2. Nhận dữ liệu cập nhật
    const body = await request.json();
    const { hoten } = body;

    if (!hoten?.trim()) {
      return NextResponse.json({ error: "Họ và tên không được để trống." }, { status: 400 });
    }

    // 3. Cập nhật thông tin trong bảng 'admin'
    const { data: updatedAdmin, error } = await supabase
      .from("admin")
      .update({ hoten: hoten.trim() })
      .eq("mataikhoan", userProfile.mataikhoan)
      .select("*")
      .single();

    if (error || !updatedAdmin) {
      return NextResponse.json({ error: "Lỗi cơ sở dữ liệu khi cập nhật hồ sơ Admin." }, { status: 500 });
    }

    // 4. Trả về kết quả thành công kèm thông tin mới
    return NextResponse.json({
      success: true,
      data: {
        ...updatedAdmin,
        email: userProfile.email,
        vaitro: userProfile.vaitro
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Lỗi máy chủ nội bộ." }, { status: 500 });
  }
}
