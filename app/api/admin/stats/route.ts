import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { requireAdmin } from "@/lib/utils/jwt";
import {
  getSinhVienDetailForStatsService,
  getGiangVienDetailForStatsService,
  globalSearchService,
  getDashboardStatsService,
} from "@/services/service/admin/stats.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalSV: number;
  totalGV: number;
  totalLop: number;
  totalKhoa: number;
  recentSV: { masv: string; hoten: string; tenlop: string; trangthai: string }[];
  recentGV: { magv: string; hoten: string; tenkhoa: string; hocvi: string | null }[];
  todaySchedules?: {
    malichhoc: number;
    tietbatdau: number;
    tietketthuc: number;
    maphong: string | null;
    loaiphong: string | null;
    suchua: number | null;
    ghichu: string | null;
    monhoc: string;
    giangvien: string;
    lop: string;
    hocky: string;
  }[];
  auditLogs?: any[];
}

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Xác thực — chỉ Admin mới được gọi endpoint này
    const payload = await requireAdmin(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const detailType = searchParams.get("detailType") ?? ""; // "sv" | "gv"
    const detailId = searchParams.get("detailId") ?? "";

    const supabase = await getSupabaseClient();
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

    // A. XỬ LÝ XEM CHI TIẾT (Detail View) + Ghi Log
    if (detailType && detailId) {
      if (detailType === "sv") {
        const data = await getSinhVienDetailForStatsService(supabase, detailId, payload, ip);
        return NextResponse.json({ success: true, data });
      } else if (detailType === "gv") {
        const data = await getGiangVienDetailForStatsService(supabase, detailId, payload, ip);
        return NextResponse.json({ success: true, data });
      } else {
        return NextResponse.json({ error: "Loại chi tiết không hợp lệ." }, { status: 400 });
      }
    }

    // B. XỬ LÝ TÌM KIẾM TOÀN CẦU (Global Search) + Ghi Log
    if (search) {
      const trimmedSearch = search.trim();
      if (trimmedSearch.length < 2 || trimmedSearch.length > 50) {
        return NextResponse.json({ error: "Từ khóa tìm kiếm không hợp lệ (yêu cầu từ 2 đến 50 ký tự)." }, { status: 400 });
      }
      
      // Loại bỏ các ký tự wildcard % và _ để tránh query quét toàn bộ database ngoài ý muốn
      const sanitizedSearch = trimmedSearch.replace(/[%_]/g, "");
      
      if (sanitizedSearch.length > 0) {
        const results = await globalSearchService(supabase, sanitizedSearch, payload, ip);
        return NextResponse.json({
          success: true,
          results
        });
      } else {
        return NextResponse.json({
          success: true,
          results: { sinhvien: [], giangvien: [], lop: [], monhoc: [] }
        });
      }
    }

    // C. MẶC ĐỊNH: Trả về Stats tổng hợp + Lịch học hôm nay + Nhật ký hệ thống
    const stats = await getDashboardStatsService(supabase);
    return NextResponse.json(stats);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi máy chủ nội bộ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}