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


// ─── Thống kê tài khoản ───────────────────────────────────────────────────────
 
export interface AccountStats {
  total: number;
  admin: number;
  giangvien: number;
  sinhvien: number;
  hoatdong: number;
  khoa: number;
}
 
export async function getAccountStats(): Promise<AccountStats> {
  const res = await apiFetch("/api/admin/taikhoan/stats");
  return (await apiJson<{ data: AccountStats }>(res)).data;
}
 
// ─── Bulk actions ─────────────────────────────────────────────────────────────
 
export type BulkAction = "lock" | "unlock" | "reset";
 
export interface BulkActionResult {
  affected: number;
  data: { mataikhoan: string; email: string; vaitro: string; trangthai: string }[];
}
 
export async function bulkAccountAction(
  ids: string[],
  action: BulkAction,
  matkhau?: string
): Promise<BulkActionResult> {
  const res = await apiFetch("/api/admin/taikhoan/bulk", {
    method: "POST",
    body: JSON.stringify({ ids, action, ...(matkhau ? { matkhau } : {}) }),
  });
  return apiJson<BulkActionResult>(res);
}
 
// ─── Xuất CSV ────────────────────────────────────────────────────────────────
 
export function exportAccountsCSV(
  rows: {
    mataikhoan: string;
    email: string;
    vaitro: string;
    trangthai: string;
    dangnhaplancuoi: string | null;
  }[]
) {
  const ROLE_LABEL: Record<string, string> = {
    Admin: "Quản trị viên",
    GiangVien: "Giảng viên",
    SinhVien: "Sinh viên",
  };
  const STATUS_LABEL: Record<string, string> = {
    HoatDong: "Hoạt động",
    Khoa: "Khoá",
  };
 
  const header = ["Mã tài khoản", "Email", "Vai trò", "Trạng thái", "Đăng nhập cuối"].join(",");
  const lines = rows.map(r =>
    [
      `"${r.mataikhoan}"`,
      `"${r.email}"`,
      `"${ROLE_LABEL[r.vaitro] ?? r.vaitro}"`,
      `"${STATUS_LABEL[r.trangthai] ?? r.trangthai}"`,
      `"${r.dangnhaplancuoi ? new Date(r.dangnhaplancuoi).toLocaleString("vi-VN") : "Chưa đăng nhập"}"`,
    ].join(",")
  );
 
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `danh-sach-tai-khoan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
 


// ─── Học kỳ ───────────────────────────────────────────────────────────────────

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

// ─── Môn học ──────────────────────────────────────────────────────────────────

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

export async function getMonhoc(params: { search?: string; makhoa?: string; batbuoc?: boolean; page?: number; limit?: number } = {}): Promise<MonhocListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== "") q.set(k, String(v)); });
  const res = await apiFetch(`/api/admin/monhoc?${q}`);
  return apiJson<MonhocListResponse>(res);
}

export async function createMonhoc(payload: Partial<MonhocRow>) {
  const res = await apiFetch("/api/admin/monhoc", { method: "POST", body: JSON.stringify(payload) });
  return (await apiJson<{ data: MonhocRow }>(res)).data;
}

export async function updateMonhoc(mamon: string, payload: Partial<MonhocRow>) {
  const res = await apiFetch(`/api/admin/monhoc/${mamon}`, { method: "PUT", body: JSON.stringify(payload) });
  return (await apiJson<{ data: MonhocRow }>(res)).data;
}

export async function deleteMonhoc(mamon: string): Promise<void> {
  const res = await apiFetch(`/api/admin/monhoc/${mamon}`, { method: "DELETE" });
  await apiJson(res);
}

// ─── Thông báo ────────────────────────────────────────────────────────────────

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

// ─── Phân công ────────────────────────────────────────────────────────────────

export interface PhanCongRow {
  maphancong: number;
  magv: string;
  mamon: string;
  malop: string;
  mahocky: number;
  malophoc?: string | null;
  sisomax?: number | null;
  danghieuluc?: boolean;
  ngaytao?: string;
  giangvien?: { hoten: string };
  monhoc?: { tenmon: string };
  lop?: { tenlop: string };
  hocky?: { tenhocky: string };
}

export interface PhanCongListResponse {
  data: PhanCongRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getPhanCong(limit = 100): Promise<PhanCongRow[]> {
  const res = await apiFetch(`/api/admin/phancong?limit=${limit}`);
  const json = await apiJson<{ data: PhanCongRow[] }>(res);
  return json.data;
}

export async function getPhanCongPaginated(params: {
  search?: string;
  magv?: string;
  mamon?: string;
  malop?: string;
  mahocky?: string;
  page?: number;
  limit?: number;
} = {}): Promise<PhanCongListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const res = await apiFetch(`/api/admin/phancong?${q}`);
  return apiJson<PhanCongListResponse>(res);
}

export async function createPhanCong(payload: Partial<PhanCongRow>): Promise<PhanCongRow> {
  const res = await apiFetch("/api/admin/phancong", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: PhanCongRow }>(res)).data;
}

export async function updatePhanCong(maphancong: number, payload: Partial<PhanCongRow>): Promise<PhanCongRow> {
  const res = await apiFetch(`/api/admin/phancong/${maphancong}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: PhanCongRow }>(res)).data;
}

export async function deletePhanCong(maphancong: number): Promise<void> {
  const res = await apiFetch(`/api/admin/phancong/${maphancong}`, {
    method: "DELETE",
  });
  await apiJson(res);
}

// ─── Lịch học ─────────────────────────────────────────────────────────────────

export interface LichHocRow {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  loaiphong: string | null;
  ghichu: string | null;
  phancong?: {
    maphancong: number;
    magv: string;
    mamon: string;
    malop: string;
    mahocky: number;
    malophoc: string | null;
    giangvien?: { hoten: string };
    monhoc?: { tenmon: string };
    lop?: { tenlop: string };
    hocky?: { tenhocky: string };
  };
}

export interface LichHocListResponse {
  data: LichHocRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getLichHoc(params: {
  maphancong?: string;
  thutrongtuan?: string;
  magv?: string;
  malop?: string;
  mahocky?: string;
  phonghoc?: string;
  page?: number;
  limit?: number;
} = {}): Promise<LichHocListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const res = await apiFetch(`/api/admin/lichhoc?${q}`);
  return apiJson<LichHocListResponse>(res);
}

export async function createLichHoc(payload: Partial<LichHocRow>): Promise<LichHocRow> {
  const res = await apiFetch("/api/admin/lichhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: LichHocRow }>(res)).data;
}

export async function updateLichHoc(malichhoc: number, payload: Partial<LichHocRow>): Promise<LichHocRow> {
  const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: LichHocRow }>(res)).data;
}

export async function deleteLichHoc(malichhoc: number): Promise<void> {
  const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
    method: "DELETE",
  });
  await apiJson(res);
}

