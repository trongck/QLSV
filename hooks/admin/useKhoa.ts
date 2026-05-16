import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

// Tái sử dụng type từ service cũ hoặc khai báo lại
export interface KhoaRow {
  makhoa: string;
  tenkhoa: string;
  dienthoai: string | null;
  email: string | null;
  ngaytao: string;
}

export function useKhoa() {
  const getKhoa = useCallback(async (search = ""): Promise<KhoaRow[]> => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiFetch(`/api/admin/khoa${q}`);
    const json = await apiJson<{ data: KhoaRow[] }>(res);
    return json.data;
  }, []);

  const createKhoa = useCallback(async (payload: Omit<KhoaRow, "ngaytao">): Promise<KhoaRow> => {
    const res = await apiFetch("/api/admin/khoa", { method: "POST", body: JSON.stringify(payload) });
    return (await apiJson<{ data: KhoaRow }>(res)).data;
  }, []);

  const updateKhoa = useCallback(async (makhoa: string, payload: Partial<KhoaRow>): Promise<KhoaRow> => {
    const res = await apiFetch(`/api/admin/khoa/${makhoa}`, { method: "PUT", body: JSON.stringify(payload) });
    return (await apiJson<{ data: KhoaRow }>(res)).data;
  }, []);

  const deleteKhoa = useCallback(async (makhoa: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/khoa/${makhoa}`, { method: "DELETE" });
    await apiJson(res);
  }, []);

  return {
    getKhoa,
    createKhoa,
    updateKhoa,
    deleteKhoa,
  };
}
