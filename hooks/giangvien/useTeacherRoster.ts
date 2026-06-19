"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface RosterClassInfo {
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
}

export interface StudentRosterRow {
  mssv: string;
  accountId: string | null;
  name: string;
  class: string;
  phone: string;
  email: string;
  parent: string;
  parentName: string;
  parentPhone: string;
  address: string;
  rawAddress: string;
}

export function useTeacherRoster() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<RosterClassInfo[]>([]);
  const [students, setStudents] = useState<StudentRosterRow[]>([]);
  const [selectedPC, setSelectedPC] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/students");
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

  const fetchRoster = useCallback(async (maphancong: number) => {
    setRosterLoading(true);
    try {
      const res = await apiFetch(`/api/giangvien/students?maphancong=${maphancong}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi tải danh sách lớp:", err);
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user, fetchClasses]);

  useEffect(() => {
    if (selectedPC) {
      fetchRoster(Number(selectedPC));
    } else {
      setStudents([]);
    }
  }, [selectedPC, fetchRoster]);

  const updateStudent = async (studentPayload: {
    masv: string;
    name: string;
    email?: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    address?: string;
  }) => {
    try {
      const res = await apiFetch("/api/giangvien/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentPayload),
      });
      const json = await res.json();
      if (json.success) {
        if (selectedPC) {
          await fetchRoster(Number(selectedPC));
        }
        return true;
      } else {
        throw new Error(json.error || "Không thể cập nhật thông tin sinh viên");
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
    rosterLoading,
    error,
    fetchClasses,
    fetchRoster,
    updateStudent,
  };
}
