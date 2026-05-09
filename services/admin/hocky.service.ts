import { apiFetch, apiJson } from "./core.service";

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

export async function getHocky(params: { search?: string; namhoc?: number } = {}): Promise<HockyListResponse> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.namhoc) q.set("namhoc", String(params.namhoc));
  const res = await apiFetch(`/api/admin/hocky?${q}`);
  return apiJson<HockyListResponse>(res);
}

export async function createHocky(payload: Partial<HockyRow>) {
  const res = await apiFetch("/api/admin/hocky", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: HockyRow }>(res)).data;
}

export async function updateHocky(mahk: number, payload: Partial<HockyRow>) {
  const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: HockyRow }>(res)).data;
}

export async function deleteHocky(mahk: number): Promise<void> {
  const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "DELETE" });
  await apiJson(res);
}

export async function activateHocky(mahk: number): Promise<HockyRow> {
  const res = await apiFetch(`/api/admin/hocky/${mahk}`, { method: "PATCH" });
  return (await apiJson<{ data: HockyRow }>(res)).data;
}
