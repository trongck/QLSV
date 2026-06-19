"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ClassLop {
  maphancong: number;
  malophoc: string;
  malop: string;
  tenmon: string;
  mamon: string;
  sotinchi: number;
  tenlop: string;
  soSinhVien: number;
  lich: Array<{
    thutrongtuan: number;
    tietbatdau: number;
    tietketthuc: number;
    phonghoc: string | null;
  }>;
  ngaybatdau: string | null;
  ngayketthuc: string | null;
}

export interface ClassLichTuanItem {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    maphancong: number;
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

export interface ClassTaiLieuItem {
  matailieu: number;
  tieude: string;
  loai: string;
  duongdan: string;
  dungluong: number | null;
  luotxem: number;
  chopheptai: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

export function useTeacherClasses() {
  const { user } = useAuth();
  const [dsLop, setDsLop] = useState<ClassLop[]>([]);
  const [lichTuan, setLichTuan] = useState<ClassLichTuanItem[]>([]);
  const [dsTaiLieu, setDsTaiLieu] = useState<ClassTaiLieuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassesData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/classes");
      const json = await res.json();
      if (json.success) {
        setDsLop(json.data.dsLop || []);
        setLichTuan(json.data.lichTuan || []);
        setDsTaiLieu(json.data.dsTaiLieu || []);
      } else {
        setError(json.error || "Không thể tải danh sách lớp học");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải danh sách lớp học");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClassesData();
    }
  }, [user, fetchClassesData]);

  return {
    dsLop,
    lichTuan,
    dsTaiLieu,
    loading,
    error,
    fetchClassesData,
  };
}
