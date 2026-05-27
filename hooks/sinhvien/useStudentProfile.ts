"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchProfileApi(): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch("/api/student/profile");
  if (!res.ok) throw new Error(`Lỗi tải hồ sơ (${res.status})`);
  return res.json();
}

async function updateProfileApi(payload: Record<string, unknown>): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch("/api/student/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lỗi cập nhật hồ sơ (${res.status})`);
  return res.json();
}

async function registerFaceApi(embedding: number[]): Promise<{
  success: boolean; message?: string; error?: string;
}> {
  const res = await apiFetch("/api/student/profile", {
    method: "PATCH",
    body: JSON.stringify({ face_embedding: embedding }),
  });
  if (!res.ok) throw new Error(`Lỗi đăng ký khuôn mặt (${res.status})`);
  return res.json();
}

export interface StudentProfile {
    masv: string;
    mataikhoan: string;
    malop: string | null;
    hoten: string;
    ngaysinh: string | null;
    gioitinh: string | null;
    anhdaidien: string | null;
    emailtruong: string | null;
    trangthai: string | null;
    chitietsinhvien: {
        diachithuongtru: string | null;
        diachitamtru: string | null;
        sodienthoai: string | null;
        emailcanhan: string | null;
        tenphuhuynh: string | null;
        sodienthoaiphuhuynh: string | null;
        cccd: string | null;
        ngaycapcccd: string | null;
        noicapcccd: string | null;
        dantoc: string | null;
        tongiao: string | null;
    };
    face_embedding: number[] | null;
}

export function useStudentProfile() {
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchProfileApi();
            if (json.success) {
                setProfile(json.data);
            } else {
                setError(json.error ?? "Không thể tải hồ sơ");
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải hồ sơ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    /** Cập nhật thông tin cá nhân */
    const updateProfile = async (payload: Record<string, unknown>) => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const json = await updateProfileApi(payload);
            setSuccessMsg("Cập nhật thông tin thành công!");
            await fetchProfile(); // Reload profile
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    /** Đăng ký khuôn mặt (face embedding) */
    const registerFace = async (embedding: number[]) => {
        setSaving(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const json = await registerFaceApi(embedding);
            setSuccessMsg("Đăng ký khuôn mặt thành công!");
            await fetchProfile();
        } catch (err: any) {
            setError(err.message);
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
        registerFace,
    };
}
