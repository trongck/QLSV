"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchDashboardAll,
  markAllNotificationsRead,
  DashboardData,
  BellNotification,
} from "@/app/api/sinhvien/dashboard.api";
import { useAuth } from "@/hooks/auth/useAuth";

export type { DashboardData, BellNotification };

export function useStudentDashboard() {
  const { user } = useAuth();
  const [data, setData]                         = useState<DashboardData | null>(null);
  const [fetching, setFetching]                 = useState(true);
  const [bellNotifications, setBellNotifications] = useState<BellNotification[]>([]);
  const [unreadBellCount, setUnreadBellCount]   = useState(0);

  const loadDashboard = useCallback(async () => {
    if (!user?.maSinhVien) return;
    setFetching(true);
    try {
      const { data: dashData, bellNotifications: bells, unreadCount } =
        await fetchDashboardAll();
      setData(dashData);
      setBellNotifications(bells);
      setUnreadBellCount(unreadCount);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setFetching(false);
    }
  }, [user?.maSinhVien]);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, loadDashboard]);

  const markAllRead = async () => {
    try {
      const json = await markAllNotificationsRead();
      if (json.success) {
        setBellNotifications(prev => prev.map(n => ({ ...n, dadoc: true })));
        setUnreadBellCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    data,
    fetching,
    bellNotifications,
    unreadBellCount,
    loadDashboard,
    markAllRead,
  };
}
