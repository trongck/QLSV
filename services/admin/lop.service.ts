import { apiFetch, apiJson } from "./core.service";

export interface LopRow {
  malop: string;
  tenlop: string;
  nganh: string | null;
  khoahoc: string | null;
  siso: number;
  makhoa: string | null;
  magv: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  khoa?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  giangvien?: any;
}

export interface LopListResponse {
  data: LopRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getLop(params: { search?: string; makhoa?: string; page?: number; limit?: number } = {}): Promise<LopListResponse> {
  const q = new URLSearchParams();
  if (params.search)  q.set("search", params.search);
  if (params.makhoa)  q.set("makhoa", params.makhoa);
  if (params.page)    q.set("page", String(params.page));
  if (params.limit)   q.set("limit", String(params.limit));
  const res = await apiFetch(`/api/admin/lop?${q}`);
  return apiJson<LopListResponse>(res);
}

export async function createLop(payload: Omit<LopRow, "siso">): Promise<LopRow> {
  const res = await apiFetch("/api/admin/lop", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: LopRow }>(res)).data;
}

export async function updateLop(malop: string, payload: Partial<LopRow>): Promise<LopRow> {
  const res = await apiFetch(`/api/admin/lop/${malop}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: LopRow }>(res)).data;
}

export async function deleteLop(malop: string): Promise<void> {
  const res = await apiFetch(`/api/admin/lop/${malop}`, { method: "DELETE" });
  await apiJson(res);
}
