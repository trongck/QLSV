/**
 * services/service/schedule.service.ts
 * UI helpers cho trang Lịch học sinh viên.
 * Các hàm gọi API đã chuyển vào services/repositories/schedule.repo.ts
 */

// Re-export tất cả từ repository để các page không cần đổi import
export * from "@/services/repositories/schedule.repo";

// ─── UI Helpers ───────────────────────────────────────────────────────────────

import type { HocKyItem } from "@/services/repositories/schedule.repo";

export const THU_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export const THU_NUMS   = [2, 3, 4, 5, 6, 7, 8];

const TIET_TIME: Record<number, string> = {
  1: "07:00",  2: "07:50",  3: "08:40",  4: "09:30",  5: "10:20",
  6: "11:10",  7: "13:00",  8: "13:50",  9: "14:40", 10: "15:30",
  11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
};

/** Tiết → giờ hiển thị */
export function tietToTime(tiet: number): string {
  return TIET_TIME[tiet] ?? `${tiet}:00`;
}

/** Tên học kỳ ngắn gọn */
export function shortHocKy(hk: HocKyItem): string {
  return `HK${hk.ky} ${hk.namhoc}-${hk.namhoc + 1}`;
}
