import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface HockyRow {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  ngaybatdau: string | null;
  ngayketthuc: string | null;
  danghieuluc: boolean;
  ngaytao: string;
}

export interface HockyListResponse {
  data: HockyRow[];
  total: number;
}

export function useHocky() {
  const getHocky = useCallback(async (params: { search?: string; namhoc?: number } = {}): Promise<HockyListResponse> => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.namhoc) q.set("namhoc", String(params.namhoc));
    const res = await apiFetch(`/api/admin/hocky?${q}`);
    return apiJson<HockyListResponse>(res);
  }, []);

  const createHocky = useCallback(async (payload: Partial<HockyRow>) => {
    const res = await apiFetch("/api/admin/hocky", { method: "POST", body: JSON.stringify(payload) });
    return (await apiJson<{ data: HockyRow }>(res)).data;
  }, []);

  const updateHocky = useCallback(async (mahk: number, payload: Partial<HockyRow>) => {
    const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "PUT", body: JSON.stringify(payload) });
    return (await apiJson<{ data: HockyRow }>(res)).data;
  }, []);

  const deleteHocky = useCallback(async (mahk: number): Promise<void> => {
    const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "DELETE" });
    await apiJson(res);
  }, []);

  const activateHocky = useCallback(async (mahk: number): Promise<HockyRow> => {
    const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "PATCH" });
    return (await apiJson<{ data: HockyRow }>(res)).data;
  }, []);

  return { getHocky, createHocky, updateHocky, deleteHocky, activateHocky };
}
