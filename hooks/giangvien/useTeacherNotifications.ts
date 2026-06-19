"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface NotificationItem {
  mathongbao: number;
  mataikhoantao: string;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  malop: string | null;
  maphancong: number | null;
  ngayhethan: string | null;
  ghim: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  dadoc: boolean;
  thoigiandoc: string | null;
  taikhoan?: { email: string; vaitro: string };
  lop?: { tenlop: string };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useTeacherNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState("");
  const [loai, setLoai] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        loai,
      });
      const res = await apiFetch(`/api/giangvien/notifications?${q}`);
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setPagination(json.pagination || null);
      } else {
        setError(json.error || "Không thể tải danh sách thông báo");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông báo");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, loai]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const createNotification = async (payload: any) => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotifications();
        return json.data;
      } else {
        throw new Error(json.error || "Không thể tạo thông báo");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const updateNotification = async (id: number, payload: any) => {
    try {
      const res = await apiFetch(`/api/giangvien/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotifications();
        return json.data;
      } else {
        throw new Error(json.error || "Không thể cập nhật thông báo");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const res = await apiFetch(`/api/giangvien/notifications/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotifications();
      } else {
        throw new Error(json.error || "Không thể xóa thông báo");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const markAsRead = async (id: number, currentRead: boolean) => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mathongbao: id, dadoc: !currentRead }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotifications();
      } else {
        throw new Error(json.error || "Lỗi cập nhật trạng thái đã đọc");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchNotifications();
      } else {
        throw new Error(json.error || "Lỗi đánh dấu đã đọc tất cả");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  return {
    notifications,
    pagination,
    loading,
    error,
    search,
    setSearch,
    loai,
    setLoai,
    page,
    setPage,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
  };
}
