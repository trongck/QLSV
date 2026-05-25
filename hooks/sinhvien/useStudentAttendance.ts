"use client";

import { useState, useEffect, useCallback } from "react";
import {
    fetchAttendanceHistory,
    fetchAttendanceStats,
    checkIn as checkInApi,
    computeAttendanceStats,
    AttendanceStats,
} from "@/app/api/sinhvien/attendance.api";
import { fetchHocKyList } from "@/app/api/sinhvien/schedule.api";
import { useAuth } from "@/hooks/auth/useAuth";

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
