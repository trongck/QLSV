/**
 * services/service/diary.service.ts
 * UI helpers cho trang Nhật ký sinh viên.
 * Các hàm gọi API đã chuyển vào services/repositories/diary.repo.ts
 */

// Re-export tất cả từ repository để các page không cần đổi import
export * from "@/services/repositories/giang vien/diary.repo";

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/** Map tâm trạng số → emoji + nhãn */
export const TAMTRANG_MAP: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😢", label: "Rất buồn", color: "text-blue-500" },
  2: { emoji: "😕", label: "Buồn", color: "text-indigo-400" },
  3: { emoji: "😐", label: "Bình thường", color: "text-gray-400" },
  4: { emoji: "😊", label: "Vui", color: "text-yellow-500" },
  5: { emoji: "😄", label: "Rất vui", color: "text-green-500" },
};

/** Format ngày giờ thân thiện */
export function formatDiaryDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Trích xuất ngày dạng dd/MM/yyyy từ ISO */
export function formatDiaryDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/** Trích xuất giờ dạng HH:mm từ ISO */
export function formatDiaryTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
