"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  class: string;
  date: string;
  isoDate: string;
  done: number;
  total: number;
  label: string;
  color: string;
  bg: string;
  maxScore: number | null;
  filedinhUrl: string | null;
}

export interface TaskSubmission {
  manopbai: number;
  noidungnop: string | null;
  filenop: string | null;
  thoigiannop: string;
  masv: string;
  hoten: string;
  malop: string;
}

export function useTeacherTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/tasks");
      const json = await res.json();
      if (json.success) {
        setTasks(json.data || []);
      } else {
        setError(json.error || "Không thể tải danh sách bài tập");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải bài tập");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (taskId: number) => {
    setSubmissionsLoading(true);
    try {
      const res = await apiFetch(`/api/giangvien/tasks/${taskId}`);
      const json = await res.json();
      if (json.success) {
        setSubmissions(json.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi tải danh sách bài nộp:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const createTask = async (formData: FormData) => {
    try {
      const res = await apiFetch("/api/giangvien/tasks", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        await fetchTasks();
        return json.data;
      } else {
        throw new Error(json.error || "Không thể tạo bài tập");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId: number, formData: FormData) => {
    try {
      const res = await apiFetch(`/api/giangvien/tasks/${taskId}`, {
        method: "PUT",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        await fetchTasks();
      } else {
        throw new Error(json.error || "Không thể cập nhật bài tập");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const gradeSubmission = async (
    maphancong: number,
    masv: string,
    grades: Array<{ loaidiem: string; giatri: number; heso: number }>
  ) => {
    try {
      const res = await apiFetch("/api/giangvien/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maphancong, masv, grades }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Lỗi khi lưu điểm");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  return {
    tasks,
    submissions,
    loading,
    submissionsLoading,
    error,
    fetchTasks,
    fetchSubmissions,
    createTask,
    updateTask,
    gradeSubmission,
  };
}
