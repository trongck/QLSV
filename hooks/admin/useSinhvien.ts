import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface SinhVienRow {
  masv: string;
  hoten: string;
  ngaysinh: string | null;
  gioitinh: string | null;
  emailtruong: string | null;
  trangthai: string;
  malop: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lop?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chitietsinhvien?: any;
}

export interface SinhVienListResponse {
  data: SinhVienRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useSinhVien() {
  const getSinhVien = useCallback(
    async (params: { search?: string; malop?: string; makhoa?: string; trangthai?: string; page?: number; limit?: number } = {}): Promise<SinhVienListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/sinhvien?${q}`);
      return apiJson<SinhVienListResponse>(res);
    },
    []
  );

  const getSinhVienById = useCallback(async (masv: string): Promise<SinhVienRow> => {
    const res = await apiFetch(`/api/admin/sinhvien/${masv}`);
    return (await apiJson<{ data: SinhVienRow }>(res)).data;
  }, []);

  const createSinhVien = useCallback(async (payload: Record<string, unknown>): Promise<SinhVienRow> => {
    const res = await apiFetch("/api/admin/sinhvien", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: SinhVienRow }>(res)).data;
  }, []);

  const updateSinhVien = useCallback(async (masv: string, payload: Record<string, unknown>): Promise<SinhVienRow> => {
    const res = await apiFetch(`/api/admin/sinhvien/${masv}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: SinhVienRow }>(res)).data;
  }, []);

  const deleteSinhVien = useCallback(async (masv: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/sinhvien/${masv}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  return {
    getSinhVien,
    getSinhVienById,
    createSinhVien,
    updateSinhVien,
    deleteSinhVien,
  };
}
