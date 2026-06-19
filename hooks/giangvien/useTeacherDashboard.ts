"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ThongBao {
  mathongbao: number;
  tieude: string;
  loai: string;
  ngaytao: string;
}

export interface LichHoc {
  malichhoc: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

export interface DashboardData {
  hoten: string;
  soLop: number;
  soSinhVien: number;
  soBaiTap: number;
  soBaiDaCham: number;
  tiLeDiemDanh: number | null;
  thongBaoMoi: ThongBao[];
  lichHomNay: LichHoc[];
}

export function useTeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Không thể tải dữ liệu dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải dashboard");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user, fetchDashboard]);

  return {
    data,
    loading,
    error,
    fetchDashboard,
  };
}
