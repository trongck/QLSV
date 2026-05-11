import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

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

export function useAdminStats() {
  const getStats = useCallback(async (): Promise<AdminStats> => {
    const res = await apiFetch("/api/admin/stats");
    if (!res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      const msg = ct.includes("application/json")
        ? ((await res.json().catch(() => ({}))) as { error?: string }).error
        : undefined;
      throw new Error(msg ?? `Không thể tải dữ liệu thống kê (${res.status}).`);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      throw new Error("Server trả về dữ liệu không hợp lệ.");
    }
    return res.json() as Promise<AdminStats>;
  }, []);

  const searchStats = useCallback(async (search: string) => {
    const res = await apiFetch(`/api/admin/stats?search=${encodeURIComponent(search)}`);
    if (!res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      const msg = ct.includes("application/json")
        ? ((await res.json().catch(() => ({}))) as { error?: string }).error
        : undefined;
      throw new Error(msg ?? `Lỗi tìm kiếm (${res.status}).`);
    }
    return res.json();
  }, []);

  const getDetail = useCallback(async (type: "sv" | "gv", id: string) => {
    const res = await apiFetch(
      `/api/admin/stats?detailType=${type}&detailId=${encodeURIComponent(id)}`
    );
    if (!res.ok) {
      const ct = res.headers.get("content-type") ?? "";
      const msg = ct.includes("application/json")
        ? ((await res.json().catch(() => ({}))) as { error?: string }).error
        : undefined;
      throw new Error(msg ?? `Lỗi tải chi tiết (${res.status}).`);
    }
    return res.json();
  }, []);

  return {
    getStats,
    searchStats,
    getDetail,
  };
}
