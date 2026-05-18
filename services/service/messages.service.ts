/**
 * services/service/messages.service.ts
 * UI helpers cho trang Tin nhắn sinh viên.
 * Các hàm gọi API đã chuyển vào services/repositories/messages.repo.ts
 */

// Re-export tất cả từ repository để các page không cần đổi import
export * from "@/services/repositories/messages.repo";

// ─── UI Helpers ───────────────────────────────────────────────────────────────

import type { ConversationRow, ConversationMember } from "@/services/repositories/messages.repo";

/**
 * Lấy tên hiển thị của cuộc trò chuyện.
 */
export function getConversationDisplayName(
  conv: ConversationRow,
  selfMataikhoan: string | null
): string {
  void selfMataikhoan;
  if (conv.tieude) return conv.tieude;
  if (conv.loai === "CaNhan" && conv.otherMembers.length > 0) {
    const other = conv.otherMembers[0];
    return other.taikhoan?.hoten ?? other.taikhoan?.email ?? "Người dùng";
  }
  return `Cuộc trò chuyện #${conv.macuoctrochuyen}`;
}

/**
 * Lấy initials avatar từ tên.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format thời gian tin nhắn.
 */
export function formatMsgTime(isoStr: string): string {
  if (!isoStr) return "";
  let timeStr = isoStr.replace(" ", "T");
  if (!timeStr.endsWith("Z") && !timeStr.includes("+") && !timeStr.match(/-\d{2}:\d{2}$/)) {
    timeStr += "Z";
  }
  const d = new Date(timeStr);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return "Hôm qua";

  const diffMs = now.getTime() - d.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDay < 7 && diffDay >= 0) {
    return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
