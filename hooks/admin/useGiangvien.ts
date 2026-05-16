import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface GiangVienRow {
  magv: string;
  hoten: string;
  ngaysinh: string | null;
  gioitinh: string | null;
  hocvi: string | null;
  chuyennganh: string | null;
  emailtruong: string | null;
  makhoa: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  khoa?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chitietgiangvien?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  taikhoan?: any;
}

export interface GiangVienListResponse {
  data: GiangVienRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function useGiangVien() {
  const getGiangVien = useCallback(
    async (params: { search?: string; makhoa?: string; page?: number; limit?: number } = {}): Promise<GiangVienListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v) q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/giangvien?${q}`);
      return apiJson<GiangVienListResponse>(res);
    },
    []
  );

  const getGiangVienById = useCallback(async (magv: string): Promise<GiangVienRow> => {
    const res = await apiFetch(`/api/admin/giangvien/${magv}`);
    return (await apiJson<{ data: GiangVienRow }>(res)).data;
  }, []);

  const createGiangVien = useCallback(async (payload: Record<string, unknown>): Promise<GiangVienRow> => {
    const res = await apiFetch("/api/admin/giangvien", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: GiangVienRow }>(res)).data;
  }, []);

  const updateGiangVien = useCallback(async (magv: string, payload: Record<string, unknown>): Promise<GiangVienRow> => {
    const res = await apiFetch(`/api/admin/giangvien/${magv}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: GiangVienRow }>(res)).data;
  }, []);

  const deleteGiangVien = useCallback(async (magv: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/giangvien/${magv}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  return {
    getGiangVien,
    getGiangVienById,
    createGiangVien,
    updateGiangVien,
    deleteGiangVien,
  };
}
