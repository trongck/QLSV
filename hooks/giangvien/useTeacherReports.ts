"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ReportData {
  matailieu: number;
  tieude: string;
  mota: string;
  duongdan: string; // JSON stats
  ngaytao: string;
}

export interface StatsData {
  avgAttendance: number;
  passRate: number;
  avgGpa: number;
  gradeDist: {
    A: number;
    B: number;
    C: number;
    DF: number;
  };
}

export function useTeacherReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [stats, setStats] = useState<StatsData>({
    avgAttendance: 0,
    passRate: 0,
    avgGpa: 0,
    gradeDist: { A: 0, B: 0, C: 0, DF: 0 },
  });
  const [selectedPC, setSelectedPC] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStats = useCallback(async (maphancong: number) => {
    try {
      const res = await apiFetch(
        `/api/giangvien/reports?maphancong=${maphancong}&action=GET_STATS`
      );
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err: any) {
      console.error("Lỗi tải thống kê học phần:", err);
    }
  }, []);

  const fetchSavedReports = useCallback(async (maphancong: number) => {
    try {
      const res = await apiFetch(
        `/api/giangvien/reports?maphancong=${maphancong}&action=GET_REPORTS`
      );
      const json = await res.json();
      if (json.success) {
        setReports(json.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi tải báo cáo đã lưu:", err);
    }
  }, []);

  const loadStatsAndReports = useCallback(async (maphancong: number) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchLiveStats(maphancong),
        fetchSavedReports(maphancong),
      ]);
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [fetchLiveStats, fetchSavedReports]);

  useEffect(() => {
    if (user && selectedPC) {
      loadStatsAndReports(Number(selectedPC));
    }
  }, [user, selectedPC, loadStatsAndReports]);

  const createReport = async (payload: {
    maphancong: number;
    tieude: string;
    mota: string;
    stats: StatsData;
  }) => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/giangvien/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchSavedReports(payload.maphancong);
        return json.data;
      } else {
        throw new Error(json.error || "Lỗi tạo báo cáo");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateReport = async (
    matailieu: number,
    payload: { tieude?: string; mota?: string }
  ) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/giangvien/reports/${matailieu}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (selectedPC) {
          await fetchSavedReports(Number(selectedPC));
        }
        return true;
      } else {
        throw new Error(json.error || "Lỗi cập nhật báo cáo");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    reports,
    stats,
    setStats,
    selectedPC,
    setSelectedPC,
    loading,
    saving,
    error,
    fetchLiveStats,
    fetchSavedReports,
    loadStatsAndReports,
    createReport,
    updateReport,
  };
}
