/**
 * services/repositories/attendance.repo.ts
 * Tầng truy cập dữ liệu cho Điểm danh (Sinh viên).
 */
import { apiFetch, apiJson } from "./api.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HocKyItem {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  danghieuluc: boolean;
}

export interface AttendanceRecord {
  madiemdanh: number;
  mabuoihoc: number;
  ngayhoc: string;
  day: string;
  month: string;
  tenmon: string;
  giangvien: string;
  phonghoc: string;
  gioVao: string;
  gioRa: string;
  thoigiandiemdanh: string | null;
  trangthai: string; // "Comat" | "Vangmat" | "Dimuon" | "Cophep"
  ghichu: string | null;
}

export interface CurrentSession {
  mabuoihoc: number;
  ngayhoc: string;
  day: string;
  month: string;
  tenmon: string;
  giangvien: string;
  phonghoc: string;
  gioVao: string;
  gioRa: string;
  maphancong: number;
}

export interface AttendanceStats {
  total: number;
  comat: number;
  vangmat: number;
  dimuon: number;
  cophep: number;
  tilechuyencan: number;
}

export interface AttendanceResponse {
  hocKyList: HocKyItem[];
  mahocky: number;
  hocKy: HocKyItem | null;
  stats: AttendanceStats;
  currentSession: CurrentSession | null;
  history: AttendanceRecord[];
}

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy lịch sử điểm danh và buổi học đang mở */
export async function getAttendance(mahocky?: number): Promise<AttendanceResponse> {
  const q = new URLSearchParams();
  if (mahocky) q.set("mahocky", String(mahocky));
  const res = await apiFetch(`/api/student/attendance${q.toString() ? `?${q}` : ""}`);
  return apiJson<AttendanceResponse>(res);
}

/** Điểm danh buổi học (qua QR hoặc khuôn mặt) */
export async function submitAttendance(payload: {
  mabuoihoc: number;
  phuongthuc: "qr" | "face";
  qr_data?: string;
}): Promise<{
  success: boolean;
  trangthai: string;
  tenmon: string;
  message: string;
}> {
  const res = await apiFetch("/api/student/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return apiJson(res);
}
