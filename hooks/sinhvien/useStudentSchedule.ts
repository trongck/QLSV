"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchHocKyList(): Promise<{ success: boolean; data: any[] }> {
  const res = await apiFetch("/api/student/hocky");
  if (!res.ok) throw new Error(`Lỗi tải học kỳ (${res.status})`);
  return res.json();
}

async function fetchSchedule(
  viewMode: "week" | "semester",
  mahocky: number
): Promise<{ success: boolean; data: any[]; error?: string }> {
  const res = await apiFetch(`/api/student/schedule?mode=${viewMode}&mahocky=${mahocky}`);
  if (!res.ok) throw new Error(`Lỗi tải lịch học (${res.status})`);
  return res.json();
}

export interface HocKy {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  ngaybatdau: string;
  ngayketthuc: string;
  danghieuluc: boolean;
}

export interface LichHoc {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  maphong: string | null;
  ghichu: string | null;
  timeRange: string;
  thuLabel: string;
  phancong?: {
    monhoc: { mamon: string; tenmon: string; sotinchi?: number } | null;
    giangvien: { magv: string; hoten: string } | null;
    hocky: HocKy | null;
    danghieuluc?: boolean;
    ngaybatdau?: string | null;
    ngayketthuc?: string | null;
  };
}

export interface SemesterSubject {
  maphancong: number;
  monhoc: { mamon: string; tenmon: string; sotinchi: number } | null;
  giangvien: { magv: string; hoten: string } | null;
  hocky: HocKy | null;
  lichhoc: (LichHoc & { timeRange: string; thuLabel: string })[];
  danghieuluc?: boolean;
  ngaybatdau?: string | null;
  ngayketthuc?: string | null;
}

export function useStudentSchedule() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"week" | "semester">("week");
  const [selectedMahocky, setSelectedMahocky] = useState<number | null>(null);
  const [weekData, setWeekData] = useState<LichHoc[]>([]);
  const [semesterData, setSemesterData] = useState<SemesterSubject[]>([]);
  const [hocKyList, setHocKyList] = useState<HocKy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy danh sách học kỳ ban đầu
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchHocKyList()
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setHocKyList(json.data);
          const current = json.data.find((h: HocKy) => h.danghieuluc);
          if (current) {
            setSelectedMahocky(current.mahocky);
          } else if (json.data.length > 0) {
            setSelectedMahocky(json.data[0].mahocky);
          }
        }
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách học kỳ:", err);
        setError(err.message ?? "Lỗi tải học kỳ");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  // Fetch lịch học tự động khi đổi viewMode hoặc selectedMahocky
  useEffect(() => {
    if (!user || selectedMahocky === null) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await fetchSchedule(viewMode, selectedMahocky);
        if (json.success) {
          if (viewMode === "week") {
            setWeekData(json.data ?? []);
          } else {
            setSemesterData(json.data ?? []);
          }
        } else {
          throw new Error(json.error ?? "Lỗi tải lịch học");
        }
      } catch (err: any) {
        setError(err.message ?? "Lỗi tải lịch học");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, viewMode, selectedMahocky]);

  return {
    viewMode,
    setViewMode,
    selectedMahocky,
    setSelectedMahocky,
    weekData,
    semesterData,
    hocKyList,
    loading,
    error,
  };
}
