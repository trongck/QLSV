import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchNotifications(): Promise<{
  success: boolean; data: any[]; unreadCount: number;
}> {
  const res = await apiFetch("/api/student/notifications");
  if (!res.ok) throw new Error(`Lỗi tải thông báo (${res.status})`);
  return res.json();
}

export async function markAsRead(mathongbao: number): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications", {
    method: "PUT",
    body: JSON.stringify({ mathongbao }),
  });
  if (!res.ok) throw new Error(`Lỗi đánh dấu đã đọc (${res.status})`);
  return res.json();
}

export async function markAllAsRead(): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications/unread", { method: "PUT" });
  if (!res.ok) throw new Error(`Lỗi đánh dấu tất cả đã đọc (${res.status})`);
  return res.json();
}
