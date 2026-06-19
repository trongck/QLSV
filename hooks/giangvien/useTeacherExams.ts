"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ExamRoomItem {
  madethi: number;
  maphancong: number;
  tieude: string;
  mota: string | null;
  thoigianlam: number;
  thoigianbatdau: string;
  thoigianketthuc: string;
  matkhau: string | null;
  ngaytao: string;
  tenlop?: string;
  tenmon?: string;
}

export function useTeacherExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/exams");
      const json = await res.json();
      if (json.success) {
        setExams(json.data || []);
      } else {
        setError(json.error || "Không thể tải danh sách đề thi");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải đề thi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchExams();
    }
  }, [user, fetchExams]);

  const createExam = async (formData: FormData) => {
    try {
      const res = await apiFetch("/api/giangvien/exams", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
        return json.data;
      } else {
        throw new Error(json.error || "Không thể tạo đề thi");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const endExam = async (madethi: number) => {
    try {
      const res = await apiFetch(`/api/giangvien/exams/${madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_EXAM" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
      } else {
        throw new Error(json.error || "Không thể kết thúc ca thi");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const updateExamTime = async (
    madethi: number,
    thoigianlam: number,
    thoigianbatdau: string,
    thoigianketthuc: string
  ) => {
    try {
      const res = await apiFetch(`/api/giangvien/exams/${madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TIME",
          thoigianlam,
          thoigianbatdau,
          thoigianketthuc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
      } else {
        throw new Error(json.error || "Không thể cập nhật thời gian thi");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const updateExamFull = async (madethi: number, formData: FormData) => {
    try {
      const res = await apiFetch(`/api/giangvien/exams/${madethi}`, {
        method: "PUT",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
      } else {
        throw new Error(json.error || "Không thể cập nhật đề thi");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  return {
    exams,
    loading,
    error,
    fetchExams,
    createExam,
    endExam,
    updateExamTime,
    updateExamFull,
  };
}
