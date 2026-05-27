"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

/** Tính thống kê tổng hợp từ dữ liệu chi tiết theo môn */
export function computeAttendanceStats(subjectData: any[]): AttendanceStats {
  let total = 0, present = 0, absent = 0, late = 0, excused = 0;
  subjectData.forEach((s) => {
    total    += s.tongbuoi  ?? 0;
    present  += s.comat     ?? 0;
    absent   += s.vang      ?? 0;
    late     += s.tremuon   ?? 0;
    excused  += s.phepvang  ?? 0;
  });
  return { total, present, absent, late, excused,
    rate: total > 0 ? Math.round((present / total) * 100) : 0 };
}

async function fetchAttendanceHistory(options?: {
  mahocky?: number;
  month?: number;
  year?: number;
  maphancong?: number;
}): Promise<{ success: boolean; data: any[] }> {
  const p = new URLSearchParams();
  p.set("mode", "history"); // Yêu cầu từ API backend
  if (options?.mahocky)    p.set("mahocky",    String(options.mahocky));
  if (options?.month)      p.set("month",      String(options.month));
  if (options?.year)       p.set("year",       String(options.year));
  if (options?.maphancong) p.set("maphancong", String(options.maphancong));
  const qs = p.toString() ? `?${p}` : "";
  const res = await apiFetch(`/api/student/attendance${qs}`);
  if (!res.ok) throw new Error(`Lỗi tải điểm danh (${res.status})`);
  return res.json();
}

async function fetchAttendanceStats(
  mahocky?: number
): Promise<{ success: boolean; data: any[] }> {
  const p = new URLSearchParams();
  p.set("mode", "stats");
  if (mahocky) p.set("mahocky", String(mahocky));
  const qs = p.toString() ? `?${p}` : "";
  const res = await apiFetch(`/api/student/attendance${qs}`);
  if (!res.ok) throw new Error(`Lỗi tải thống kê điểm danh (${res.status})`);
  return res.json();
}

async function checkInApi(
  mabuoihoc: number,
  phuongthuc: "qr" | "face"
): Promise<{ success: boolean; message?: string }> {
  const res = await apiFetch("/api/student/attendance/checkin", {
    method: "POST",
    body: JSON.stringify({ mabuoihoc, phuongthuc }),
  });
  if (!res.ok) throw new Error(`Lỗi điểm danh (${res.status})`);
  return res.json();
}

async function fetchHocKyList(): Promise<{ success: boolean; data: any[] }> {
  const res = await apiFetch("/api/student/hocky");
  if (!res.ok) throw new Error(`Lỗi tải học kỳ (${res.status})`);
  return res.json();
}

export interface AttendanceRecord {
    madiemdanh: number;
    thoigian: string;
    trangthai: string;
    phuongthuc: string;
    ghichu: string | null;
    ngayhoc: string | null;
    day: string;
    month: string;
    timeStr: string;
    monhoc: { mamon: string; tenmon: string } | null;
    phong: string | null;
    giangvien: { magv?: string; hoten: string } | null;
    hocky: any | null;
    maphancong: number | null;
}

export interface HocKy {
    mahocky: number;
    tenhocky: string;
    namhoc: string;
    ky: number;
    danghieuluc: boolean;
}

export function useStudentAttendance() {
    const { user } = useAuth();
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [subjectStats, setSubjectStats] = useState<any[]>([]);
    const [hocKyList, setHocKyList] = useState<HocKy[]>([]);
    const [currentMahocky, setCurrentMahocky] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async (options?: { mahocky?: number; month?: number; year?: number; maphancong?: number }) => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchAttendanceHistory(options);
            if (json.success) {
                setHistory(json.data ?? []);
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải lịch sử điểm danh");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStats = useCallback(async (mahocky?: number) => {
        try {
            const json = await fetchAttendanceStats(mahocky);
            if (json.success) {
                const data = json.data ?? [];
                setSubjectStats(data);
                const computed = computeAttendanceStats(data);
                setStats(computed);
            }
        } catch (err: any) {
            console.error("Lỗi tải thống kê điểm danh:", err);
        }
    }, []);

    const fetchHocKyListFunc = useCallback(async () => {
        try {
            const json = await fetchHocKyList();
            if (json.success) {
                setHocKyList(json.data ?? []);
                const active = (json.data ?? []).find((hk: HocKy) => hk.danghieuluc);
                if (active) setCurrentMahocky(active.mahocky);
            }
        } catch (err: any) {
            console.error("Lỗi tải danh sách học kỳ:", err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchHocKyListFunc();
            fetchHistory();
            fetchStats();
        }
    }, [user, fetchHocKyListFunc, fetchHistory, fetchStats]);

    const changeHocKy = (mahocky: number) => {
        setCurrentMahocky(mahocky);
        fetchHistory({ mahocky });
        fetchStats(mahocky);
    };

    /** Điểm danh thủ công */
    const checkIn = async (mabuoihoc: number, phuongthuc: "qr" | "face") => {
        setCheckinLoading(true);
        setError(null);
        try {
            const json = await checkInApi(mabuoihoc, phuongthuc);
            await fetchHistory({ mahocky: currentMahocky ?? undefined });
            return json;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setCheckinLoading(false);
        }
    };

    return {
        history,
        stats,
        subjectStats,
        hocKyList,
        currentMahocky,
        loading,
        checkinLoading,
        error,
        fetchHistory,
        fetchStats,
        changeHocKy,
        checkIn,
    };
}
