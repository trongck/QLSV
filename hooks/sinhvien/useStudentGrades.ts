"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchGrades as fetchGradesApi } from "@/app/api/sinhvien/grades.api";
import { useAuth } from "@/hooks/auth/useAuth";

export interface GradeItem {
    stt: number;
    mamon: string;
    malophoc: string;
    mahocky: number;
    tenmon: string;
    sotinchi: number;
    giangvien: string;
    diem10: number | null;
    diemchu: string | null;
    ketqua: string | null;
    dat: boolean;
    coDiem: boolean;
    diemThanhPhan: { loai: string; giatri: number; heso: number }[];
}

export interface GpaView {
    masv: string;
    hoten: string;
    emailtruong: string;
    malop: string;
    tenlop: string;
    gpa10_hocky_hientai: number;
    gpa4_hocky_hientai: number;
    sotinchi_hocky_hientai: number;
    sotinchi_dat_hocky_hientai: number;
    gpa10_tich_luy: number;
    gpa4_tich_luy: number;
    tong_sotinchi_da_hoc: number;
    sotinchi_tich_luy_dat: number;
    xep_loai_hoc_luc: string | null;
    xep_loai_hoc_luc_he4: string | null;
}

export interface HocKy {
    mahocky: number;
    tenhocky: string;
    namhoc: string;
    ky: number;
    danghieuluc: boolean;
}

export function useStudentGrades() {
    const { user } = useAuth();
    const [mahocky, setMahocky] = useState<string>("");
    const [grades, setGrades] = useState<GradeItem[]>([]);
    const [gpaView, setGpaView] = useState<GpaView | null>(null);
    const [hocKyList, setHocKyList] = useState<HocKy[]>([]);
    const [hoten, setHoten] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastFetchedRef = useRef<string | null>(null);

    const fetchGrades = useCallback(async () => {
        if (lastFetchedRef.current === mahocky) return;
        setLoading(true);
        setError(null);
        try {
            const json = await fetchGradesApi(mahocky);
            setGrades(json.grades ?? []);
            setGpaView(json.gpaView ?? null);
            setHocKyList(json.hocKyList ?? []);
            setHoten(json.hoten ?? "");

            const resolved = json.mahocky !== undefined && json.mahocky !== null ? String(json.mahocky) : "all";
            lastFetchedRef.current = resolved;
            if (mahocky !== resolved) {
                setMahocky(resolved);
            }
        } catch (err: any) {
            setError(err.message ?? "Lỗi tải điểm");
        } finally {
            setLoading(false);
        }
    }, [mahocky]);

    useEffect(() => {
        if (user) fetchGrades();
    }, [user, fetchGrades]);

    return {
        mahocky,
        setMahocky,
        grades,
        gpaView,
        hocKyList,
        hoten,
        loading,
        error,
        fetchGrades,
    };
}
