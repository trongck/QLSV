"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchNotifications as fetchNotificationsApi,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi
} from "@/app/api/sinhvien/notifications.api";
import { useAuth } from "@/hooks/auth/useAuth";

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
        if (user) fetchNotifications();
    }, [user, fetchNotifications]);

    /** Đánh dấu một thông báo đã đọc */
    const markAsRead = async (mathongbao: number) => {
        try {
            const json = await markAsReadApi(mathongbao);
            if (json.success) {
                setNotifications((prev) =>
                    prev.map((n) => (n.mathongbao === mathongbao ? { ...n, dadoc: true } : n))
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
