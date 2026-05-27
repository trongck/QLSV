"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchAssignmentsApi(): Promise<{
  success: boolean; data: any[]; message?: string;
}> {
  const res = await apiFetch("/api/student/assignment");
  if (!res.ok) throw new Error(`Lỗi tải bài tập (${res.status})`);
  return res.json();
}

async function uploadFileApi(
  file: File
): Promise<{ success: boolean; url?: string; fileName?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/student/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Lỗi upload file (${res.status})`);
  return res.json();
}

async function submitAssignmentApi(
  mabaitap: number,
  noidungnop: string | null,
  filenop: string | null
): Promise<{ success: boolean; updated?: boolean; message?: string }> {
  const res = await apiFetch("/api/student/assignment", {
    method: "POST",
    body: JSON.stringify({ mabaitap, noidungnop, filenop }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài (${res.status})`);
  return res.json();
}

export interface Assignment {
    mabaitap: number;
    tieude: string;
    mota: string | null;
    filedinh: string | null;
    hannop: string;
    loai: string;
    ngaytao: string;
    maphancong: number;
    phancong?: {
        monhoc: { mamon: string; tenmon: string } | null;
        giangvien: { magv: string; hoten: string } | null;
    };
    nopbai?: {
        manopbai: number;
        thoigiannop: string;
        trenop: boolean;
        diem: number | null;
        nhanxet: string | null;
        filenop: string | null;
        noidungnop: string | null;
    } | null;
}

export function useStudentAssignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("Tất cả");

    const fetchAssignments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchAssignmentsApi();
            if (json.success) {
                setAssignments(json.data);
            } else {
                setError(json.message ?? "Không thể tải danh sách bài tập");
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải bài tập");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchAssignments();
    }, [user, fetchAssignments]);

    /** Upload file bài nộp */
    const uploadFile = async (file: File): Promise<string | null> => {
        try {
            const json = await uploadFileApi(file);
            if (json.success && json.url) {
                return `${json.url}?name=${encodeURIComponent(json.fileName || file.name)}`;
            }
            return null;
        } catch {
            return null;
        }
    };

    /** Nộp bài tập */
    const submitAssignment = async (
        mabaitap: number,
        noidungnop: string | null,
        filenop: string | null
    ) => {
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const json = await submitAssignmentApi(mabaitap, noidungnop, filenop);
            setSuccessMsg(json.updated ? "Cập nhật bài nộp thành công!" : "Nộp bài thành công!");
            await fetchAssignments(); // Reload
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    /** Nộp bài có kèm upload file (nếu có) */
    const handleSubmitWithUpload = async (
        mabaitap: number,
        noidungnop: string | null,
        file: File | null,
        existingFileUrl: string | null
    ) => {
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);
        try {
            let filenop = existingFileUrl;
            if (file) {
                const uploadedUrl = await uploadFile(file);
                if (!uploadedUrl) {
                    throw new Error("Upload file thất bại.");
                }
                filenop = uploadedUrl;
            }
            await submitAssignment(mabaitap, noidungnop, filenop);
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi nộp bài.");
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAssignments = assignments.filter((item) => {
        const matchSearch =
            item.tieude.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.phancong?.monhoc?.tenmon ?? "").toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch) return false;

        if (activeTab === "Chưa làm") {
            return !item.nopbai;
        }
        if (activeTab === "Đã nộp") {
            return !!item.nopbai;
        }
        return true;
    });

    return {
        assignments,
        filteredAssignments,
        loading,
        submitting,
        error,
        successMsg,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        fetchAssignments,
        submitAssignment,
        handleSubmitWithUpload,
        uploadFile,
    };
}
