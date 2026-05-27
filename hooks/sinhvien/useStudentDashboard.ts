"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface BellNotification {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  dadoc: boolean;
  ngaytao: string;
}

export type DashboardData = Record<string, any>;

async function fetchDashboardAll(): Promise<{
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

async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const res = await apiFetch("/api/student/notifications", {
    method: "PATCH",
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error(`Lỗi đánh dấu thông báo (${res.status})`);
  return res.json();
}

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
