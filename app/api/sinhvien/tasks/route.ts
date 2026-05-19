import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

// GET /api/sinhvien/tasks — Danh sách bài tập (kèm trạng thái nộp)
// POST /api/sinhvien/tasks — Nộp bài tập

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
    const submissions = searchParams.get("submissions");

    if (submissions === "true") {
      const data = await sinhVienService.getMySubmissions(sv.masv);
      return NextResponse.json({ success: true, data });
    }

    const data = await sinhVienService.getAssignments(sv.masv);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/tasks:", err.message);
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
    const { mabaitap, noidungnop, filenop } = body;

    if (!mabaitap) {
      return NextResponse.json({ error: "Thiếu mã bài tập" }, { status: 400 });
    }

    const result = await sinhVienService.submitAssignment(
      sv.masv,
      Number(mabaitap),
      noidungnop ?? null,
      filenop ?? null
    );

    return NextResponse.json({
      success: true,
      message: result.updated ? "Cập nhật bài nộp thành công" : "Nộp bài thành công",
      data: result
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/sinhvien/tasks:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
