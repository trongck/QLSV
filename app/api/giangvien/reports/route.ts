import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { giangVienService } from "@/services/service/giangvien/teacher.service";

export async function GET(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json({ error: "Chưa cung cấp token" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const maphancong = searchParams.get("maphancong");
  const action = searchParams.get("action") || "GET_STATS";

  if (!maphancong) {
    return NextResponse.json({ error: "Thiếu maphancong" }, { status: 400 });
  }

  try {
    const payload = await verifyToken(token) as any;

    if (payload.vaitro !== VaiTro.GiangVien) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

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

    if (action === "GET_REPORTS") {
      const reports = await giangVienService.getReports(gv.magv, Number(maphancong));
      return NextResponse.json({ success: true, data: reports });
    }

    // Default: GET_STATS
    const stats = await giangVienService.getClassStats(gv.magv, Number(maphancong));
    return NextResponse.json({ success: true, data: stats });
  } catch (err: any) {
    console.error("Lỗi GET /api/giangvien/reports:", err.message);
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

    const { maphancong, tieude, mota, stats } = await request.json();

    if (!maphancong || !tieude) {
      return NextResponse.json({ error: "Thiếu maphancong hoặc tieude" }, { status: 400 });
    }

    const newReport = await giangVienService.createReport(
      gv.magv,
      Number(maphancong),
      tieude,
      mota || "",
      JSON.stringify(stats || {})
    );

    return NextResponse.json({ success: true, data: newReport });
  } catch (err: any) {
    console.error("Lỗi POST /api/giangvien/reports:", err.message);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi tạo báo cáo" },
      { status: 500 }
    );
  }
}
