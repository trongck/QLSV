/**
 * services/repositories/schedule.repo.ts
 * Tầng truy cập dữ liệu cho Lịch học (Sinh viên).
 */
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "./api.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HocKyItem {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: 1 | 2 | 3;
  ngaybatdau: string | null;
  ngayketthuc: string | null;
  danghieuluc: boolean;
}

export interface WeekScheduleItem {
  maphancong: number;
  mamon: string;
  tenmon: string;
  giangvien: string;
  thu: number;
  thuLabel: string;
  tietBatDau: number;
  tietKetThuc: number;
  gioVao: string;
  gioRa: string;
  phonghoc: string;
  ghichu: string | null;
  color: string;
}

export interface SemesterSubjectItem {
  maphancong: number;
  mamon: string;
  tenmon: string;
  sotinchi: number;
  giangvien: string;
  color: string;
  scheduleItems: {
    malichhoc: number;
    thu: number;
    thuLabel: string;
    tietBatDau: number;
    tietKetThuc: number;
    gioVao: string;
    gioRa: string;
    phonghoc: string;
    ghichu: string | null;
  }[];
}

export interface ScheduleResponse<T> {
  hocKyList: HocKyItem[];
  mahocky: number | null;
  hocKy: HocKyItem | null;
  view: "week" | "semester";
  data: T[];
}

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy lịch học dạng TUẦN */
export async function getWeekSchedule(mahocky?: number): Promise<ScheduleResponse<WeekScheduleItem>> {
  const q = new URLSearchParams({ view: "week" });
  if (mahocky) q.set("mahocky", String(mahocky));
  const res = await apiFetch(`/api/student/schedule?${q}`);
  return apiJson<ScheduleResponse<WeekScheduleItem>>(res);
}

/** Lấy lịch học dạng HỌC KỲ (tất cả môn trong kỳ) */
export async function getSemesterSchedule(mahocky?: number): Promise<ScheduleResponse<SemesterSubjectItem>> {
  const q = new URLSearchParams({ view: "semester" });
  if (mahocky) q.set("mahocky", String(mahocky));
  const res = await apiFetch(`/api/student/schedule?${q}`);
  return apiJson<ScheduleResponse<SemesterSubjectItem>>(res);
}
