"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ProfileData {
  magv: string;
  mataikhoan: string;
  makhoa: string;
  hodem: string;
  ten: string;
  ngaysinh: string | null;
  gioitinh: "Nam" | "Nu" | "Khac" | null;
  hocvi: string | null;
  chuyennganh: string | null;
  anhdaidien: string | null;
  emailtruong: string | null;
  thanhtuu: string | null;
  diachi: string | null;
  sodienthoai: string | null;
  emailcanhan: string | null;
  ngayvaotruong: string | null;
  hesoluong: number | null;
  hoten: string;
}

export function useTeacherProfile(isOpen = false) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiFetch("/api/giangvien/profile");
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
      } else {
        setError(json.error || "Không thể tải thông tin hồ sơ");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen, fetchProfile]);

  const updateProfile = async (payload: any) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiFetch("/api/giangvien/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Cập nhật thông tin hồ sơ cá nhân thành công!");
        await fetchProfile();
        return true;
      } else {
        setError(json.error || "Cập nhật thất bại");
        return false;
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối máy chủ");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    successMsg,
    fetchProfile,
    updateProfile,
  };
}
