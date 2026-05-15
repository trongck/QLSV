/**
 * services/diary.service.ts
 * Client-side service cho trang nhật ký sinh viên — gọi API /api/student/diary/*
 */
import { apiFetch } from "./auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NhatKyItem {
  manhatky: number;
  masv: string | null;
  magv: string | null;
  tieude: string | null;
  noidung: string;
  tamtrang: 1 | 2 | 3 | 4 | 5 | null;
  maphancong: number | null;
  ngaytao: string;
  ngaycapnhat: string;
}

export interface DiaryListResponse {
  data: NhatKyItem[];
  masv: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Lấy danh sách nhật ký của sinh viên đang đăng nhập.
 */
export async function getDiaryList(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DiaryListResponse> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page)   q.set("page", String(params.page));
  if (params?.limit)  q.set("limit", String(params.limit));

  const url = `/api/student/diary${q.toString() ? `?${q}` : ""}`;
  const res = await apiFetch(url);
  return apiJson<DiaryListResponse>(res);
}

/**
 * Lấy chi tiết một nhật ký theo ID.
 */
export async function getDiaryDetail(manhatky: number): Promise<NhatKyItem> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`);
  const json = await apiJson<{ data: NhatKyItem }>(res);
  return json.data;
}

/**
 * Tạo nhật ký mới.
 */
export async function createDiary(payload: {
  tieude?: string;
  noidung: string;
  tamtrang?: number | null;
}): Promise<NhatKyItem> {
  const res = await apiFetch("/api/student/diary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const json = await apiJson<{ data: NhatKyItem }>(res);
  return json.data;
}

/**
 * Cập nhật nhật ký.
 */
export async function updateDiary(
  manhatky: number,
  payload: Partial<{
    tieude: string | null;
    noidung: string;
    tamtrang: number | null;
  }>
): Promise<NhatKyItem> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const json = await apiJson<{ data: NhatKyItem }>(res);
  return json.data;
}

/**
 * Xoá nhật ký.
 */
export async function deleteDiary(manhatky: number): Promise<void> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`, {
    method: "DELETE",
  });
  await apiJson<{ success: boolean }>(res);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

/** Map tâm trạng số → emoji + nhãn */
export const TAMTRANG_MAP: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😢", label: "Rất buồn",   color: "text-blue-500" },
  2: { emoji: "😕", label: "Buồn",        color: "text-indigo-400" },
  3: { emoji: "😐", label: "Bình thường", color: "text-gray-400" },
  4: { emoji: "😊", label: "Vui",         color: "text-yellow-500" },
  5: { emoji: "😄", label: "Rất vui",     color: "text-green-500" },
};

/** Format ngày giờ thân thiện (tiếng Việt) */
export function formatDiaryDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH} giờ trước`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return `${diffD} ngày trước`;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Trích xuất ngày dạng dd/MM/yyyy từ ISO */
export function formatDiaryDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Trích xuất giờ dạng HH:mm từ ISO */
export function formatDiaryTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
