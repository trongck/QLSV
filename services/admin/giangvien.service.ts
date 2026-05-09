import { apiFetch, apiJson } from "./core.service";

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
}

export interface GiangVienListResponse {
  data: GiangVienRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getGiangVien(params: { search?: string; makhoa?: string; page?: number; limit?: number } = {}): Promise<GiangVienListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
  const res = await apiFetch(`/api/admin/giangvien?${q}`);
  return apiJson<GiangVienListResponse>(res);
}

export async function getGiangVienById(magv: string): Promise<GiangVienRow> {
  const res = await apiFetch(`/api/admin/giangvien/${magv}`);
  return (await apiJson<{ data: GiangVienRow }>(res)).data;
}

export async function createGiangVien(payload: Record<string, unknown>) {
  const res = await apiFetch("/api/admin/giangvien", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: GiangVienRow }>(res)).data;
}

export async function updateGiangVien(magv: string, payload: Record<string, unknown>) {
  const res = await apiFetch(`/api/admin/giangvien/${magv}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: GiangVienRow }>(res)).data;
}

export async function deleteGiangVien(magv: string): Promise<void> {
  const res = await apiFetch(`/api/admin/giangvien/${magv}`, { method: "DELETE" });
  await apiJson(res);
}
