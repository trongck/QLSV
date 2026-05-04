/**
 * services/admin.service.ts
 * Tập trung tất cả các lời gọi API phía admin
 */
import { apiFetch } from "./auth.service";

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function apiJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    const msg = ct.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { error?: string }).error
      : undefined;
    throw new Error(msg ?? `Lỗi ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Khoa ─────────────────────────────────────────────────────────────────────

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

// ─── Lop ──────────────────────────────────────────────────────────────────────

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

// ─── SinhVien ─────────────────────────────────────────────────────────────────

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

// ─── GiangVien ────────────────────────────────────────────────────────────────

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

// ─── TaiKhoan ─────────────────────────────────────────────────────────────────

export interface TaiKhoanRow {
  mataikhoan: string;
  email: string;
  vaitro: string;
  trangthai: string;
  dangnhaplancuoi: string | null;
}

export interface TaiKhoanListResponse {
  data: TaiKhoanRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getTaiKhoan(params: { search?: string; vaitro?: string; trangthai?: string; page?: number; limit?: number } = {}): Promise<TaiKhoanListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
  const res = await apiFetch(`/api/admin/taikhoan?${q}`);
  return apiJson<TaiKhoanListResponse>(res);
}

export async function updateTaiKhoan(mataikhoan: string, payload: { trangthai?: string; matkhau?: string }) {
  const res = await apiFetch(`/api/admin/taikhoan/${mataikhoan}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: TaiKhoanRow }>(res)).data;
}

export async function deleteTaiKhoan(mataikhoan: string): Promise<void> {
  const res = await apiFetch(`/api/admin/taikhoan/${mataikhoan}`, { method: "DELETE" });
  await apiJson(res);
}