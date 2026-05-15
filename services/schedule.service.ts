/**
 * services/schedule.service.ts
 * Client-side service cho trang lịch học sinh viên — gọi API /api/student/schedule
 */
import { apiFetch } from "./auth.service";

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

/** Một buổi học (dùng cho dạng TUẦN) */
export interface WeekScheduleItem {
  maphancong: number;
  mamon: string;
  tenmon: string;
  giangvien: string;
  thu: number;        // 2–8
  thuLabel: string;   // "Thứ 2" … "Chủ nhật"
  tietBatDau: number;
  tietKetThuc: number;
  gioVao: string;     // "07:00"
  gioRa: string;      // "09:30"
  phonghoc: string;
  ghichu: string | null;
  color: string;      // Tailwind class
}

/** Một môn học (dùng cho dạng HỌC KỲ) */
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

// ─── Helper ───────────────────────────────────────────────────────────────────

async function apiJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    const msg = ct.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { error?: string }).error
      : undefined;
    throw new Error(msg ?? `Lỗi ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

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

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export const THU_LABELS = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","Chủ nhật"];
export const THU_NUMS   = [2, 3, 4, 5, 6, 7, 8];

/** Tiết → giờ hiển thị */
const TIET_TIME: Record<number, string> = {
  1: "07:00",  2: "07:50",  3: "08:40",  4: "09:30",  5: "10:20",
  6: "11:10",  7: "13:00",  8: "13:50",  9: "14:40", 10: "15:30",
  11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
};

export function tietToTime(tiet: number): string {
  return TIET_TIME[tiet] ?? `${tiet}:00`;
}

/** Tên học kỳ ngắn gọn */
export function shortHocKy(hk: HocKyItem): string {
  return `HK${hk.ky} ${hk.namhoc}-${hk.namhoc + 1}`;
}
