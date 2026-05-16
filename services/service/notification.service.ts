/**
 * services/service/notification.service.ts
 * UI helpers cho trang Thông báo sinh viên.
 * Các hàm gọi API đã chuyển vào services/repositories/notification.repo.ts
 */

// Re-export tất cả từ repository để các page không cần đổi import
export * from "@/services/repositories/notification.repo";

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/** Map loại thông báo sang nhãn tiếng Việt */
export const LOAI_LABEL: Record<string, string> = {
  Chung: "Chung",
  Hoctap: "Học tập",
  Thoikhoabieu: "TKB",
  Diem: "Điểm",
  Baitap: "Bài tập",
  Tailieu: "Tài liệu",
  Khancap: "Khẩn cấp",
};

/** Trích xuất ảnh nhúng trong nội dung thông báo */
export function parseNotificationContent(noidung: string): { imageUrl: string | null; text: string } {
  const match = noidung.match(/^\s*\[IMAGE_URL:([^\]]+)\]([\s\S]*)$/i);
  if (match) {
    const imageUrl = match[1].trim();
    let text = match[2];
    if (text.startsWith("\n")) text = text.slice(1);
    else if (text.startsWith("\r\n")) text = text.slice(2);
    return { imageUrl, text };
  }
  return { imageUrl: null, text: noidung };
}

/** Format ngày tháng thân thiện */
export function formatNotifDate(iso: string): string {
  if (!iso) return "";
  let timeStr = iso.replace(" ", "T");
  if (!timeStr.endsWith("Z") && !timeStr.includes("+") && !timeStr.match(/-\d{2}:\d{2}$/)) {
    timeStr += "Z";
  }
  const d = new Date(timeStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
