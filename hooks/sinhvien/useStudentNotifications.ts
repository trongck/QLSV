"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchNotificationsApi(): Promise<{
  success: boolean;
  data: any[];
  unreadCount: number;
}> {
  const res = await apiFetch("/api/student/notifications");
  if (!res.ok) throw new Error(`Lỗi tải thông báo (${res.status})`);
  return res.json();
}

async function markAsReadApi(
  mathongbao: number,
): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications", {
    method: "PATCH",
    body: JSON.stringify({ mathongbao }),
  });
  if (!res.ok) throw new Error(`Lỗi đánh dấu đã đọc (${res.status})`);
  return res.json();
}

async function markAllAsReadApi(): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications", {
    method: "PATCH",
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error(`Lỗi đánh dấu tất cả đã đọc (${res.status})`);
  return res.json();
}

export interface Notification {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  ghim: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  dadoc: boolean;
  thoigiandoc: string | null;
  dacapnhat: boolean;
}

export function useStudentNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchNotificationsApi();
      if (json.success) {
        setNotifications(json.data ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch (err: any) {
      setError(err.message ?? "Lỗi tải thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void fetchNotifications();
    }
  }, [user, fetchNotifications]);

  /** Đánh dấu một thông báo đã đọc */
  const markAsRead = async (mathongbao: number) => {
    try {
      const json = await markAsReadApi(mathongbao);
      if (json.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.mathongbao === mathongbao ? { ...n, dadoc: true } : n,
          ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc:", err);
    }
  };

  /** Đánh dấu tất cả đã đọc */
  const markAllAsRead = async () => {
    try {
      const json = await markAllAsReadApi();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, dadoc: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
