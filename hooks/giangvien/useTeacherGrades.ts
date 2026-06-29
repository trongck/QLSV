"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface GradeClassInfo {
  maphancong: number;
  malophoc: string;
  malop: string;
  monhoc?: {
    tenmon: string;
    sotinchi: number;
  };
  lop?: {
    tenlop: string;
  };
  hocky?: {
    mahocky: number;
    tenhocky: string;
    namhoc: string;
    ky: number;
    danghieuluc?: boolean;
  };
}

export interface StudentGradeRow {
  stt: number;
  masv: string;
  hoten: string;
  malop: string;
  diemChuyenCan: { giatri: number; heso: number } | null;
  diemGiuaKy: { giatri: number; heso: number } | null;
  diemCuoiKy: { giatri: number; heso: number } | null;
  tongKet: { diemtongket: number; diemchu: string; ketqua: string } | null;
  nopbaiFiles?: { tieude: string; filenop: string }[];
}

export function useTeacherGrades() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<GradeClassInfo[]>([]);
  const [students, setStudents] = useState<StudentGradeRow[]>([]);
  const [selectedPC, setSelectedPC] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/grades");
      const json = await res.json();
      if (json.success) {
        setClasses(json.data || []);
        if (json.data && json.data.length > 0) {
          setSelectedPC(json.data[0].maphancong);
        }
      } else {
        setError(json.error || "Không thể tải danh sách lớp");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải lớp học");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGrades = useCallback(async (maphancong: number) => {
    setGradesLoading(true);
    try {
      const res = await apiFetch(`/api/giangvien/grades?maphancong=${maphancong}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi tải bảng điểm:", err);
    } finally {
      setGradesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user, fetchClasses]);

  useEffect(() => {
    if (selectedPC) {
      fetchGrades(Number(selectedPC));
    } else {
      setStudents([]);
    }
  }, [selectedPC, fetchGrades]);

  const saveGrade = async (
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
      if (json.success) {
        await fetchGrades(maphancong);
      } else {
        throw new Error(json.error || "Lỗi khi lưu điểm");
      }
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  return {
    classes,
    students,
    selectedPC,
    setSelectedPC,
    loading,
    gradesLoading,
    error,
    fetchClasses,
    fetchGrades,
    saveGrade,
  };
}
