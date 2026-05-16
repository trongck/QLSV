/**
 * services/repositories/notification.repo.ts
 * Tầng truy cập dữ liệu cho Thông báo (Sinh viên).
 */
import { apiFetch, apiJson } from "./api.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThongBaoItem {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  malop: string | null;
  ghim: boolean;
  ngaytao: string;
  ngayhethan: string | null;
  ngaycapnhat?: string;
  dadoc: boolean;
  thoigiandoc: string | null;
  admin: { hoten: string } | null;
  giangvien: { hoten: string } | null;
  lop: { tenlop: string } | null;
}

export interface NotificationListResponse {
  data: ThongBaoItem[];
  masv: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy danh sách thông báo dành cho sinh viên */
export async function getStudentNotifications(params?: {
  search?: string;
  loai?: string;
  tab?: "tatca" | "chuadoc" | "dadoc";
  page?: number;
  limit?: number;
}): Promise<NotificationListResponse> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.loai)   q.set("loai", params.loai);
  if (params?.tab)    q.set("tab", params.tab);
  if (params?.page)   q.set("page", String(params.page));
  if (params?.limit)  q.set("limit", String(params.limit));
  const url = `/api/student/notification${q.toString() ? `?${q}` : ""}`;
  const res = await apiFetch(url);
  return apiJson<NotificationListResponse>(res);
}

/** Lấy chi tiết 1 thông báo (tự động đánh dấu đã đọc) */
export async function getStudentNotificationDetail(mathongbao: number): Promise<ThongBaoItem> {
  const res = await apiFetch(`/api/student/notification/${mathongbao}`);
  const json = await apiJson<{ data: ThongBaoItem }>(res);
  return json.data;
}

/** Đánh dấu thông báo đã đọc */
export async function markNotificationRead(mathongbao: number): Promise<void> {
  const res = await apiFetch(`/api/student/notification/${mathongbao}`, { method: "PATCH" });
  await apiJson<{ success: boolean }>(res);
}
