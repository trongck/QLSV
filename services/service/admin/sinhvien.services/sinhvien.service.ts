import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "./core.service";

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

export async function getSinhVien(params: { search?: string; malop?: string; makhoa?: string; trangthai?: string; page?: number; limit?: number } = {}): Promise<SinhVienListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
  const res = await apiFetch(`/api/admin/sinhvien?${q}`);
  return apiJson<SinhVienListResponse>(res);
}

export async function getSinhVienById(masv: string) {
  const res = await apiFetch(`/api/admin/sinhvien/${masv}`);
  return (await apiJson<{ data: unknown }>(res)).data;
}

export async function createSinhVien(payload: Record<string, unknown>) {
  const res = await apiFetch("/api/admin/sinhvien", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: SinhVienRow }>(res)).data;
}

export async function updateSinhVien(masv: string, payload: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/sinhvien/${masv}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: SinhVienRow }>(res)).data;
}

export async function deleteSinhVien(masv: string): Promise<void> {
  const res = await apiFetch(`/api/admin/sinhvien/${masv}`, { method: "DELETE" });
  await apiJson(res);
}
