"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchExamsApi(): Promise<{
  success: boolean; data: any[]; message?: string;
}> {
  const res = await apiFetch("/api/student/exam");
  if (!res.ok) throw new Error(`Lỗi tải bài thi (${res.status})`);
  return res.json();
}

async function fetchExamDetailApi(madethi: number): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch(`/api/student/exam/${madethi}`);
  if (!res.ok) throw new Error(`Lỗi tải đề thi (${res.status})`);
  return res.json();
}

async function submitExamApi(
  madethi: number,
  answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
  cheatCount?: number
): Promise<{ success: boolean; data: any; error?: string }> {
  const res = await apiFetch(`/api/student/exam/${madethi}`, {
    method: "POST",
    body: JSON.stringify({ answers, cheatCount }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài thi (${res.status})`);
  return res.json();
}

async function fetchExamResultApi(madethi: number): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch(`/api/student/exam/${madethi}/result`);
  if (!res.ok) throw new Error(`Lỗi tải kết quả thi (${res.status})`);
  return res.json();
}

export interface Exam {
    madethi: number;
    tieude: string;
    mota: string | null;
    thoigianlam: number;
    thoigianbatdau: string;
    thoigianketthuc: string;
    maphancong: number | null;
    matkhau: string | null;
    solan: number | null;
    trangthai: "DaLam" | "ChuaLam";
    diemtong?: number;
    socandung?: number;
    monhoc?: string;
}

export interface ExamDetail extends Exam {
    questions: {
        macauhoi: number;
        noidung: string;
        hinhanh: string | null;
        loaicauhoi: string;
        diem: number;
        thutu: number;
        dapan: { madapan: number; noidung: string; thutu: number }[];
    }[];
}

export function useStudentExams() {
    const { user } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchExams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchExamsApi();
            if (json.success) {
                setExams(json.data ?? []);
            } else {
                setError(json.message ?? "Không thể tải danh sách bài thi");
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải bài thi");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) fetchExams();
    }, [user, fetchExams]);

    /** Lấy chi tiết đề thi */
    const fetchExamDetail = async (madethi: number): Promise<ExamDetail | null> => {
        try {
            const json = await fetchExamDetailApi(madethi);
            if (!json.success) throw new Error(json.error ?? "Không thể tải đề thi");
            return json.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    /** Nộp bài thi */
    const submitExam = async (
        madethi: number,
        answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
        cheatCount?: number
    ) => {
        setSubmitting(true);
        setError(null);
        try {
            const json = await submitExamApi(madethi, answers, cheatCount);
            await fetchExams(); // Reload để cập nhật trạng thái
            return json.data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    /** Lấy kết quả bài thi chi tiết */
    const fetchExamResult = async (madethi: number) => {
        try {
            const json = await fetchExamResultApi(madethi);
            if (!json.success) throw new Error(json.error ?? "Không thể tải kết quả");
            return json.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    return {
        exams,
        loading,
        submitting,
        error,
        fetchExams,
        fetchExamDetail,
        submitExam,
        fetchExamResult,
    };
}
