/**
 * lib/utils/date.utils.ts
 * Các hàm tiện ích xử lý ngày/giờ dùng chung trong phân hệ sinh viên.
 */

/** Format ISO string → "DD/MM/YYYY, HH:mm" theo locale Việt Nam */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format ISO string → "DD/MM" ngắn gọn */
export function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Format Date → "DD/MM/YYYY" đầy đủ */
export function formatDateFull(d: Date): string {
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Cộng thêm n ngày vào một Date */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Trả về ngày Thứ Hai của tuần chứa date */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Kiểm tra xem một ghi chú có đã được cập nhật hay chưa (ngaycapnhat > ngaytao + 1s) */
export function isUpdated(ngaytao: string | null | undefined, ngaycapnhat: string | null | undefined): boolean {
  if (!ngaycapnhat || !ngaytao) return false;
  return new Date(ngaycapnhat).getTime() - new Date(ngaytao).getTime() > 1000;
}
