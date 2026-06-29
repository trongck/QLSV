"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface LopItem {
  maphancong: number;
  malophoc: string;
  tenmon: string;
  mamon: string;
  tenlop: string;
  lichDay?: number[];
}

export interface BuoiHocItem {
  mabuoihoc: number;
  malichhoc: number;
  maphancong?: number;
  ngayhoc: string;
  trangthai: string;
  qr_secret?: string;
}

export interface LeaveRequestItem {
  id: number;
  mssv: string;
  name: string;
  class: string;
  dateRequested: string;
  reason: string;
  dateSubmitted: string;
  evidence: string;
  status: string;
}

export interface StudentAttendance {
  mssv: string;
  name: string;
  status: string;
  type: string;
  time: string;
  note: string;
  face_embedding?: number[] | null;
}

export function useTeacherAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<LopItem[]>([]);
  const [allSessions, setAllSessions] = useState<BuoiHocItem[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [roster, setRoster] = useState<StudentAttendance[]>([]);

  // Selection States
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [selectedBH, setSelectedBH] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const fetchOverview = useCallback(async (selectFirst = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/giangvien/attendance");
      const json = await res.json();
      if (json.success) {
        setClasses(json.data.dsLop || []);
        setAllSessions(json.data.buoiHocList || []);
        setLeaveRequests(json.data.dsDonXinNghi || []);

        if (selectFirst && json.data.dsLop?.length > 0) {
          setSelectedPC(json.data.dsLop[0].maphancong);
        }
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin điểm danh");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoster = useCallback(async (mabuoihoc: number, maphancong: number) => {
    try {
      const res = await apiFetch(
        `/api/giangvien/attendance?mabuoihoc=${mabuoihoc}&maphancong=${maphancong}`
      );
      const json = await res.json();
      if (json.success) {
        setRoster(json.data || []);
      }
    } catch (err: any) {
      console.error("Lỗi tải danh sách điểm danh:", err);
    }
  }, []);

  // Fetch overview on mount/auth
  useEffect(() => {
    if (user) {
      fetchOverview(true);
    }
  }, [user, fetchOverview]);

  // Fetch roster when selected session or class changes
  useEffect(() => {
    if (selectedBH && selectedPC) {
      fetchRoster(selectedBH, selectedPC);
    } else {
      setRoster([]);
    }
  }, [selectedBH, selectedPC, fetchRoster]);

  // Auto-refresh roster mỗi 10 giây khi buổi học đang điểm danh
  useEffect(() => {
    if (!selectedBH || !selectedPC) return;

    const activeSession = allSessions.find((s) => s.mabuoihoc === selectedBH);
    if (activeSession?.trangthai !== "DangDiemdanh") return;

    const interval = setInterval(() => {
      fetchRoster(selectedBH, selectedPC);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedBH, selectedPC, allSessions, fetchRoster]);

  // Automatically find matching session when class or date changes
  useEffect(() => {
    if (!selectedPC) return;
    const match = allSessions.find(
      (s) => s.ngayhoc === selectedDate && s.maphancong === selectedPC
    );
    if (match) {
      setSelectedBH(match.mabuoihoc);
    } else {
      setSelectedBH(null);
    }
  }, [selectedPC, selectedDate, allSessions]);

  // Create attendance session
  const createSession = async () => {
    if (!selectedPC) return;

    // Ràng buộc kiểm tra lịch dạy học phần trong ngày chọn
    const activeClass = classes.find(c => c.maphancong === selectedPC);
    if (activeClass && activeClass.lichDay && activeClass.lichDay.length > 0) {
      const jsDay = new Date(selectedDate).getDay();
      const dbDay = jsDay === 0 ? 8 : jsDay + 1;
      if (!activeClass.lichDay.includes(dbDay)) {
        alert("Lớp học phần này không có lịch dạy vào thứ được chọn!");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSession",
          maphancong: selectedPC,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOverview(false);
        setSelectedBH(json.data.mabuoihoc);
      } else {
        throw new Error(json.error || "Không thể tạo buổi học");
      }
    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate / refresh QR Code
  const refreshQR = async () => {
    if (!selectedBH) return;
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateQR",
          mabuoihoc: selectedBH,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const newSecret = json.data.qr_secret;
        setAllSessions((prev) =>
          prev.map((s) =>
            s.mabuoihoc === selectedBH ? { ...s, qr_secret: newSecret } : s
          )
        );
      }
    } catch (err: any) {
      console.error("Lỗi làm mới mã QR:", err);
    }
  };

  // Update student status
  const updateStatus = async (mssv: string, newStatus: string) => {
    if (!selectedBH) return;
    try {
      const current = roster.find((r) => r.mssv === mssv);
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAttendance",
          mabuoihoc: selectedBH,
          masv: mssv,
          status: newStatus,
          ghichu: current?.note || "-",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoster((prev) =>
          prev.map((item) => {
            if (item.mssv === mssv) {
              const type =
                newStatus === "Có mặt"
                  ? "green"
                  : newStatus === "Đi muộn" || newStatus === "Vắng có phép"
                  ? "orange"
                  : "red";
              return {
                ...item,
                status: newStatus,
                type,
                time:
                  newStatus === "Có mặt" || newStatus === "Đi muộn"
                    ? new Date().toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--",
              };
            }
            return item;
          })
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Update student note
  const updateNote = async (mssv: string, newNote: string) => {
    if (!selectedBH) return;
    try {
      const current = roster.find((r) => r.mssv === mssv);
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAttendance",
          mabuoihoc: selectedBH,
          masv: mssv,
          status: current?.status || "Vắng",
          ghichu: newNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoster((prev) =>
          prev.map((item) =>
            item.mssv === mssv ? { ...item, note: newNote } : item
          )
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Approve leave request
  const approveLeave = async (madon: number, mssv: string) => {
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLeave",
          madon,
          status: "Đã duyệt",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === madon ? { ...req, status: "Đã duyệt" } : req
          )
        );
        setRoster((prev) =>
          prev.map((std) =>
            std.mssv === mssv
              ? {
                  ...std,
                  status: "Vắng có phép",
                  type: "orange",
                  note: "Vắng có phép (Đơn xin nghỉ)",
                }
              : std
          )
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Reject leave request
  const rejectLeave = async (madon: number) => {
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLeave",
          madon,
          status: "Từ chối",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLeaveRequests((prev) =>
          prev.map((req) =>
            req.id === madon ? { ...req, status: "Từ chối" } : req
          )
        );
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // End attendance session
  const endSession = async () => {
    if (!selectedBH) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "endSession",
          mabuoihoc: selectedBH,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOverview(false);
      } else {
        throw new Error(json.error || "Không thể kết thúc ca điểm danh");
      }
    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    classes,
    allSessions,
    leaveRequests,
    roster,
    selectedPC,
    setSelectedPC,
    selectedBH,
    setSelectedBH,
    selectedDate,
    setSelectedDate,
    fetchOverview,
    createSession,
    refreshQR,
    updateStatus,
    updateNote,
    approveLeave,
    rejectLeave,
    endSession,
  };
}
