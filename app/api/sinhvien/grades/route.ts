import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

// GET /api/sinhvien/grades
// Query params: ?summary=true → trả về điểm tổng kết. Mặc định: điểm chi tiết.

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
    const summary = searchParams.get("summary");

    if (summary === "true") {
      const data = await sinhVienService.getGradeSummary(sv.masv);
      return NextResponse.json({ success: true, data });
    }

    // Chi tiết điểm + tổng kết đi kèm
    const [grades, gradeSummary] = await Promise.all([
      sinhVienService.getGrades(sv.masv),
      sinhVienService.getGradeSummary(sv.masv)
    ]);

    return NextResponse.json({
      success: true,
      data: { chiTiet: grades, tongKet: gradeSummary }
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/grades:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}
