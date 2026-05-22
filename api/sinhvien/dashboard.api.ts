import { studentFetch } from "./client";

export interface BellNotification {
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

export interface DashboardData {
  hoten: string;
  masv: string;
  monHocCount: number;
  gpa10_hocky_hientai: number;
  gpa4_hocky_hientai: number;
  gpa10_tich_luy: number;
  gpa4_tich_luy: number;
  xep_loai_hoc_luc: string | null;
  soBuoiVang: number;
  soBaiTapConHan: number;
  lichHocHomNay: any[];
  thongBaoGanDay: any[];
  diemGanDay: any[];
}

export async function fetchDashboardAll(): Promise<{
  success: boolean;
  data: DashboardData;
  bellNotifications: BellNotification[];
  unreadCount: number;
}> {
  const [dashRes, notifRes] = await Promise.all([
    studentFetch("/api/student/dashboard"),
    studentFetch("/api/student/notifications"),
  ]);
  const dashJson = await dashRes.json();
  const notifJson = await notifRes.json();
  return {
    success: true,
    data: dashJson.data,
    bellNotifications: notifJson.data ?? [],
    unreadCount: notifJson.unreadCount ?? 0,
  };
}

export async function markAllNotificationsRead() {
  const res = await studentFetch("/api/student/notifications", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ all: true }),
  });
  return res.json();
}
