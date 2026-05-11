import { useCallback } from "react";
import { apiFetch, apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface MonhocRow {
  mamon: string;
  tenmon: string;
  sotinchi: number;
  sotietlythuyet: number | null;
  sotietthuchanh: number | null;
  mota: string | null;
  batbuoc: boolean;
  makhoa: string | null;
  ngaytao: string;
  khoa?: { tenkhoa: string };
}

export interface MonhocListResponse {
  data: MonhocRow[];
  pagination: { 
    page: number; 
    limit: number; 
    total: number; 
    totalPages: number;
    countRequired: number;
    countOptional: number;
    totalAll: number;
  };
}

export function useMonhoc() {
  const getMonhoc = useCallback(
    async (params: { search?: string; makhoa?: string; batbuoc?: boolean; page?: number; limit?: number } = {}): Promise<MonhocListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/monhoc?${q}`);
      return apiJson<MonhocListResponse>(res);
    },
    []
  );

  const createMonhoc = useCallback(async (payload: Partial<MonhocRow>): Promise<MonhocRow> => {
    const res = await apiFetch("/api/admin/monhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: MonhocRow }>(res)).data;
  }, []);

  const updateMonhoc = useCallback(async (mamon: string, payload: Partial<MonhocRow>): Promise<MonhocRow> => {
    const res = await apiFetch(`/api/admin/monhoc/${mamon}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ data: MonhocRow }>(res)).data;
  }, []);

  const deleteMonhoc = useCallback(async (mamon: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/monhoc/${mamon}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  return {
    getMonhoc,
    createMonhoc,
    updateMonhoc,
    deleteMonhoc,
  };
}
