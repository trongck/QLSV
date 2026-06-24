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

export interface StudentMonitorItem {
  masv: string;
  hoten: string;
  trangthai: "ChuaVao" | "DangLam" | "DaNop" | "HetGio" | "ViPham";
  socauhoi: number;
  diemtong: number | null;
  maketqua: number | null;
  thoigiannopbai?: string | null;
}

export interface MonitoringStats {
  tongSV: number;
  chuaVao: number;
  dangLam: number;
  daNop: number;
  hetGio: number;
  viPham: number;
}

export interface MonitoringData {
  exam: {
    madethi: number;
    tieude: string;
    thoigianbatdau: string;
    thoigianketthuc: string;
    thoigianlam: number;
    tenmon: string;
    tenlop: string;
  };
  stats: MonitoringStats;
  students: StudentMonitorItem[];
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

  const forceEndExam = async (madethi: number) => {
    try {
      const res = await apiFetch(`/api/giangvien/exams/${madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FORCE_END" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchExams();
        return true;
      } else {
        throw new Error(json.error || "Không thể kết thúc ca thi");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const getMonitoringData = async (madethi: number): Promise<MonitoringData | null> => {
    try {
      const res = await apiFetch(`/api/giangvien/exams/${madethi}`);
      const json = await res.json();
      if (json.success) {
        return json.data as MonitoringData;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getExamHistory = async () => {
    try {
      const res = await apiFetch("/api/giangvien/exams/history");
      const json = await res.json();
      if (json.success) return json.data;
      return { upcoming: [], ended: [] };
    } catch {
      return { upcoming: [], ended: [] };
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
    forceEndExam,
    getMonitoringData,
    getExamHistory,
    updateExamTime,
    updateExamFull,
  };
}
