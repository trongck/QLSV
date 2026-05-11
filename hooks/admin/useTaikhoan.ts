import { useCallback } from "react";
import { apiFetch, apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface TaiKhoanRow {
  mataikhoan: string;
  email: string;
  vaitro: string;
  trangthai: string;
  dangnhaplancuoi: string | null;
}

export interface TaiKhoanListResponse {
  data: TaiKhoanRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AccountStats {
  total: number;
  admin: number;
  giangvien: number;
  sinhvien: number;
  hoatdong: number;
  khoa: number;
}

export type BulkAction = "lock" | "unlock" | "reset";

export interface BulkActionResult {
  affected: number;
  data: { mataikhoan: string; email: string; vaitro: string; trangthai: string }[];
}

export function useTaiKhoan() {
  const getTaiKhoan = useCallback(
    async (params: { search?: string; vaitro?: string; trangthai?: string; page?: number; limit?: number } = {}): Promise<TaiKhoanListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/taikhoan?${q}`);
      return apiJson<TaiKhoanListResponse>(res);
    },
    []
  );

  const updateTaiKhoan = useCallback(async (mataikhoan: string, payload: { trangthai?: string; matkhau?: string }): Promise<TaiKhoanRow> => {
    const res = await apiFetch(`/api/admin/taikhoan/${mataikhoan}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: TaiKhoanRow }>(res)).data;
  }, []);

  const deleteTaiKhoan = useCallback(async (mataikhoan: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/taikhoan/${mataikhoan}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  const getAccountStats = useCallback(async (): Promise<AccountStats> => {
    const res = await apiFetch("/api/admin/taikhoan/stats");
    return (await apiJson<{ data: AccountStats }>(res)).data;
  }, []);

  const bulkAccountAction = useCallback(
    async (ids: string[], action: BulkAction, matkhau?: string): Promise<BulkActionResult> => {
      const res = await apiFetch("/api/admin/taikhoan/bulk", {
        method: "POST",
        body: JSON.stringify({ ids, action, ...(matkhau ? { matkhau } : {}) }),
      });
      return apiJson<BulkActionResult>(res);
    },
    []
  );

  const exportAccountsCSV = useCallback((rows: TaiKhoanRow[]) => {
    const ROLE_LABEL: Record<string, string> = {
      Admin: "Quản trị viên",
      GiangVien: "Giảng viên",
      SinhVien: "Sinh viên",
    };
    const STATUS_LABEL: Record<string, string> = {
      HoatDong: "Hoạt động",
      Khoa: "Khoá",
    };

    const header = ["Mã tài khoản", "Email", "Vai trò", "Trạng thái", "Đăng nhập cuối"].join(",");
    const lines = rows.map((r) =>
      [
        `"${r.mataikhoan}"`,
        `"${r.email}"`,
        `"${ROLE_LABEL[r.vaitro] ?? r.vaitro}"`,
        `"${STATUS_LABEL[r.trangthai] ?? r.trangthai}"`,
        `"${r.dangnhaplancuoi ? new Date(r.dangnhaplancuoi).toLocaleString("vi-VN") : "Chưa đăng nhập"}"`,
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-sach-tai-khoan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    getTaiKhoan,
    updateTaiKhoan,
    deleteTaiKhoan,
    getAccountStats,
    bulkAccountAction,
    exportAccountsCSV,
  };
}
