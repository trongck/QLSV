import { NextResponse } from "next/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { sinhVienService } from "@/services/student.service";

// GET /api/sinhvien/schedule
// Query params: ?day=X (thứ trong tuần 2-8, không truyền = cả tuần)

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
    const day = searchParams.get("day");

    if (day) {
      // Lịch học theo ngày cụ thể — dùng view lichhocsinhvien
      const { cookies: ck } = await import("next/headers");
      const cs = await ck();
      const sb = createClient(cs);

      const { data, error } = await sb
        .from("lichhocsinhvien")
        .select("tenmon, phonghoc, tietbatdau, tietketthuc")
        .eq("masv", sv.masv)
        .eq("thutrongtuan", Number(day))
        .order("tietbatdau", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, data: data ?? [] });
    }

    // Lịch học cả tuần — dùng bảng gốc kèm join
    const schedule = await sinhVienService.getFullSchedule(sv.masv);
    return NextResponse.json({ success: true, data: schedule });
  } catch (err: any) {
    console.error("Lỗi GET /api/sinhvien/schedule:", err.message);
    return NextResponse.json(
      { error: "Phiên đăng nhập hết hạn hoặc không hợp lệ" },
      { status: 401 }
    );
  }
}
