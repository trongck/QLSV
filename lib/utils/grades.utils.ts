/**
 * lib/utils/grades.utils.ts
 * Các hàm tiện ích xử lý điểm số / xếp loại học lực dùng chung trong phân hệ sinh viên.
 */

export interface XepLoaiStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/** Trả về bộ màu tương ứng với xếp loại học lực */
export function xepLoaiStyle(xl: string | null | undefined): XepLoaiStyle {
  switch (xl) {
    case "Xuất sắc": return { bg: "#fef3c7", text: "#92400e", border: "#fbbf24", dot: "#f59e0b" };
    case "Giỏi":     return { bg: "#d1fae5", text: "#065f46", border: "#34d399", dot: "#10b981" };
    case "Khá":      return { bg: "#dbeafe", text: "#1e40af", border: "#60a5fa", dot: "#3b82f6" };
    case "Trung bình": return { bg: "#f3f4f6", text: "#374151", border: "#9ca3af", dot: "#6b7280" };
    case "Yếu":      return { bg: "#fee2e2", text: "#991b1b", border: "#f87171", dot: "#ef4444" };
    case "Kém":      return { bg: "#fce7f3", text: "#831843", border: "#f472b6", dot: "#ec4899" };
    default:         return { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db", dot: "#9ca3af" };
  }
}

/** Trả về màu chữ theo thang điểm 10 */
export function diem10Color(d: number | null | undefined): string {
  if (d == null) return "#9ca3af";
  if (d >= 8.5) return "#065f46";
  if (d >= 7.0) return "#1d4ed8";
  if (d >= 5.5) return "#92400e";
  if (d >= 4.0) return "#c2410c";
  return "#991b1b";
}

/** Trả về nhãn hiển thị cho loại điểm thành phần */
export function loaiLabel(loai: string): string {
  const map: Record<string, string> = {
    ChuyenCan: "Chuyên cần",
    GiuaKy: "Giữa kỳ",
    CuoiKy: "Cuối kỳ",
    Thuchanh: "Thực hành",
    Tieuluan: "Tiểu luận",
  };
  return map[loai] ?? loai;
}

/** Format số thập phân với số chữ số sau dấu phẩy */
export function fmt(n: number | undefined | null, digits = 2): string {
  return (n ?? 0).toFixed(digits);
}
