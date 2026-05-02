import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalSV:   number;
  totalGV:   number;
  totalLop:  number;
  totalKhoa: number;
  recentSV: { masv: string; hoten: string; tenlop: string; trangthai: string }[];
  recentGV: { magv: string; hoten: string; tenkhoa: string; hocvi: string | null }[];
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Xác thực — chỉ Admin mới được gọi endpoint này
    const token = extractBearer(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn." }, { status: 401 });
    }

    if (payload.vaitro !== VaiTro.Admin) {
      return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
    }

    // 2. Truy vấn Supabase (parallel)
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const [
      { count: totalSV },
      { count: totalGV },
      { count: totalLop },
      { count: totalKhoa },
      { data: svList },
      { data: gvList },
    ] = await Promise.all([
      supabase.from("sinhvien").select("masv",  { count: "exact", head: true }),
      supabase.from("giangvien").select("magv", { count: "exact", head: true }),
      supabase.from("lop").select("malop",      { count: "exact", head: true }),
      supabase.from("khoa").select("makhoa",    { count: "exact", head: true }),
      supabase
        .from("sinhvien")
        .select("masv, hoten, trangthai, lop(tenlop)")
        .order("masv", { ascending: false })
        .limit(8),
      supabase
        .from("giangvien")
        .select("magv, hoten, hocvi, khoa(tenkhoa)")
        .order("magv", { ascending: false })
        .limit(8),
    ]);

    // 3. Transform & trả về
    const stats: AdminStats = {
      totalSV:   totalSV   ?? 0,
      totalGV:   totalGV   ?? 0,
      totalLop:  totalLop  ?? 0,
      totalKhoa: totalKhoa ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentSV: (svList ?? []).map((sv: any) => ({
        masv:      sv.masv,
        hoten:     sv.hoten,
        tenlop:    sv.lop?.tenlop ?? "—",
        trangthai: sv.trangthai,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentGV: (gvList ?? []).map((gv: any) => ({
        magv:    gv.magv,
        hoten:   gv.hoten,
        tenkhoa: gv.khoa?.tenkhoa ?? "—",
        hocvi:   gv.hocvi ?? null,
      })),
    };

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}