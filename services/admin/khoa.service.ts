import { apiFetch, apiJson } from "./core.service";

export interface KhoaRow {
  makhoa: string;
  tenkhoa: string;
  dienthoai: string | null;
  email: string | null;
  ngaytao: string;
}

export async function getKhoa(search = ""): Promise<KhoaRow[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await apiFetch(`/api/admin/khoa${q}`);
  const json = await apiJson<{ data: KhoaRow[] }>(res);
  return json.data;
}

export async function createKhoa(payload: Omit<KhoaRow, "ngaytao">): Promise<KhoaRow> {
  const res = await apiFetch("/api/admin/khoa", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: KhoaRow }>(res)).data;
}

export async function updateKhoa(makhoa: string, payload: Partial<KhoaRow>): Promise<KhoaRow> {
  const res = await apiFetch(`/api/admin/khoa/${makhoa}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: KhoaRow }>(res)).data;
}

export async function deleteKhoa(makhoa: string): Promise<void> {
  const res = await apiFetch(`/api/admin/khoa/${makhoa}`, { method: "DELETE" });
  await apiJson(res);
}
