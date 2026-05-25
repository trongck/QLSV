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
  const dashData = json.data ?? json;
  
  const rawNotifications = dashData.thongBaoGanDay ?? [];
  const bellNotifications: BellNotification[] = rawNotifications.map((tb: any) => ({
    mathongbao: tb.mathongbao,
    tieude: tb.tieude,
    noidung: tb.noidung,
    loai: tb.loai,
    dadoc: tb.dadoc ?? false,
    ngaytao: tb.ngaytao,
  }));
  
  const unreadCount = bellNotifications.filter(n => !n.dadoc).length;
  
  return {
    data: dashData,
    bellNotifications,
    unreadCount,
  };
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications/unread", { method: "PUT" });
  if (!res.ok) throw new Error(`Lỗi đánh dấu thông báo (${res.status})`);
  return res.json();
}
