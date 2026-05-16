import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface PhanCongRow {
  maphancong: number;
  magv: string;
  mamon: string;
  malop: string;
  mahocky: number;
  malophoc?: string | null;
  sisomax?: number | null;
  danghieuluc?: boolean;
  ngaybatdau?: string;
  ngayketthuc?: string;
  ngaytao?: string;
  giangvien?: { hoten: string };
  monhoc?: { tenmon: string };
  lop?: { tenlop: string };
  hocky?: { tenhocky: string };
}

export interface PhanCongListResponse {
  data: PhanCongRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function usePhanCong() {
  const getPhanCong = useCallback(async (limit = 100): Promise<PhanCongRow[]> => {
    const res = await apiFetch(`/api/admin/phancong?limit=${limit}`);
    const json = await apiJson<{ data: PhanCongRow[] }>(res);
    return json.data;
  }, []);

  const getPhanCongPaginated = useCallback(
    async (
      params: {
        search?: string;
        magv?: string;
        mamon?: string;
        malop?: string;
        mahocky?: string;
        status?: string;
        page?: number;
        limit?: number;
      } = {}
    ): Promise<PhanCongListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/phancong?${q}`);
      return apiJson<PhanCongListResponse>(res);
    },
    []
  );

  const createPhanCong = useCallback(async (payload: Partial<PhanCongRow>): Promise<PhanCongRow> => {
    const res = await apiFetch("/api/admin/phancong", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: PhanCongRow }>(res)).data;
  }, []);

  const updatePhanCong = useCallback(async (maphancong: number, payload: Partial<PhanCongRow>): Promise<PhanCongRow> => {
    const res = await apiFetch(`/api/admin/phancong/${maphancong}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: PhanCongRow }>(res)).data;
  }, []);

  const deletePhanCong = useCallback(async (maphancong: number): Promise<void> => {
    const res = await apiFetch(`/api/admin/phancong/${maphancong}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  return {
    getPhanCong,
    getPhanCongPaginated,
    createPhanCong,
    updatePhanCong,
    deletePhanCong,
  };
}
