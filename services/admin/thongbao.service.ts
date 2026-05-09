import { apiFetch, apiJson } from "./core.service";

export interface ThongbaoRow {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  malop: string | null;
  maphancong: number | null;
  ngayhethan: string | null;
  ghim: boolean;
  ngaytao: string;
  maadmintao: string | null;
  magvtao: string | null;
  admin?: { hoten: string };
  giangvien?: { hoten: string };
  lop?: { tenlop: string };
}

export interface ThongbaoListResponse {
  data: ThongbaoRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getThongbao(params: { search?: string; loai?: string; doituong?: string; trangthai?: string; page?: number; limit?: number } = {}): Promise<ThongbaoListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
  const res = await apiFetch(`/api/admin/thongbao?${q}`);
  return apiJson<ThongbaoListResponse>(res);
}

export async function createThongbao(payload: Partial<ThongbaoRow>) {
  const res = await apiFetch("/api/admin/thongbao", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: ThongbaoRow }>(res)).data;
}

export async function updateThongbao(id: number, payload: Partial<ThongbaoRow>) {
  const res = await apiFetch(`/api/admin/thongbao/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  return (await apiJson<{ data: ThongbaoRow }>(res)).data;
}

export async function deleteThongbao(mathongbao: number): Promise<void> {
  const res = await apiFetch(`/api/admin/thongbao/${mathongbao}`, { method: "DELETE" });
  await apiJson(res);
}
