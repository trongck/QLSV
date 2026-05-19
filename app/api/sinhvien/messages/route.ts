import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

// GET /api/sinhvien/messages — Danh sách cuộc trò chuyện, hoặc tin nhắn cụ thể
// Query: ?macuoctrochuyen=X → tin nhắn trong cuộc trò chuyện đó
// POST /api/sinhvien/messages — Gửi tin nhắn

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
      .select("masv")
      .eq("mataikhoan", payload.mataikhoan)
      .single();

    if (!sv) {
      return NextResponse.json({ error: "Không tìm thấy sinh viên" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const macuoctrochuyen = searchParams.get("macuoctrochuyen");

    if (macuoctrochuyen) {
      const messages = await sinhVienService.getMessages(sv.masv, Number(macuoctrochuyen));
      return NextResponse.json({ success: true, data: messages });
    }

    const conversations = await sinhVienService.getConversations(sv.masv);
    return NextResponse.json({ success: true, data: conversations });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/messages:", err.message);
    return NextResponse.json(
      { error: err.message || "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
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
    const { macuoctrochuyen, noidung, filedinh } = body;

    if (!macuoctrochuyen || !noidung) {
      return NextResponse.json({ error: "Thiếu thông tin cuộc trò chuyện hoặc nội dung" }, { status: 400 });
    }

    const message = await sinhVienService.sendMessage(
      sv.masv,
      Number(macuoctrochuyen),
      noidung,
      filedinh ?? null
    );

    return NextResponse.json({
      success: true,
      message: "Gửi tin nhắn thành công",
      data: message
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/sinhvien/messages:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
