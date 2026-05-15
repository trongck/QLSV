/**
 * services/notification.service.ts
 * Client-side service cho trang thông báo sinh viên — gọi API /api/student/notification/*
 */
import { apiFetch } from "./auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThongBaoItem {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;       // LoaiThongBao enum value
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Lấy danh sách thông báo dành cho sinh viên đang đăng nhập.
 * @param params - Các tham số lọc/phân trang
 */
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

/**
 * Lấy chi tiết 1 thông báo. API tự động đánh dấu đã đọc cho sinh viên.
 */
export async function getStudentNotificationDetail(mathongbao: number): Promise<ThongBaoItem> {
  const res = await apiFetch(`/api/student/notification/${mathongbao}`);
  const json = await apiJson<{ data: ThongBaoItem }>(res);
  return json.data;
}

/**
 * Đánh dấu thông báo đã đọc (không cần mở chi tiết).
 */
export async function markNotificationRead(mathongbao: number): Promise<void> {
  const res = await apiFetch(`/api/student/notification/${mathongbao}`, {
    method: "PATCH",
  });
  await apiJson<{ success: boolean }>(res);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/** Map loại thông báo sang nhãn tiếng Việt */
export const LOAI_LABEL: Record<string, string> = {
  Chung: "Chung",
  Hoctap: "Học tập",
  Thoikhoabieu: "TKB",
  Diem: "Điểm",
  Baitap: "Bài tập",
  Tailieu: "Tài liệu",
  Khancap: "Khẩn cấp",
};

/** Format ngày tháng thân thiện */
export function formatNotifDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
