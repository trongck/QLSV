import { apiFetch } from "@/services/service/auth/auth.service";

export interface BellNotification {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  dadoc: boolean;
  ngaytao: string;
}

// Dùng kiểu linh hoạt để khớp với mọi field trả về từ API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DashboardData = Record<string, any>;

export async function fetchDashboardAll(): Promise<{
  data: DashboardData;
  bellNotifications: BellNotification[];
  unreadCount: number;
}> {
  const res = await apiFetch("/api/student/dashboard");
  if (!res.ok) throw new Error(`Lỗi tải dashboard (${res.status})`);
  const json = await res.json();
  return {
    data: json.data ?? json,
    bellNotifications: json.bellNotifications ?? [],
    unreadCount: json.unreadCount ?? 0,
  };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications/unread", { method: "PUT" });
  if (!res.ok) throw new Error(`Lỗi đánh dấu thông báo (${res.status})`);
  return res.json();
}
