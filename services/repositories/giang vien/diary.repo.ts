/**
 * services/repositories/diary.repo.ts
 * Tầng truy cập dữ liệu cho Nhật ký sinh viên.
 */
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "./api.utils";

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

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy danh sách nhật ký */
export async function getDiaryList(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<DiaryListResponse> {
  const q = new URLSearchParams();
  if (params?.search) q.set("search", params.search);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const url = `/api/student/diary${q.toString() ? `?${q}` : ""}`;
  const res = await apiFetch(url);
  return apiJson<DiaryListResponse>(res);
}

/** Lấy chi tiết một nhật ký */
export async function getDiaryDetail(manhatky: number): Promise<NhatKyItem> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`);
  const json = await apiJson<{ data: NhatKyItem }>(res);
  return json.data;
}

/** Tạo nhật ký mới */
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

/** Cập nhật nhật ký */
export async function updateDiary(
  manhatky: number,
  payload: Partial<{ tieude: string | null; noidung: string; tamtrang: number | null }>
): Promise<NhatKyItem> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const json = await apiJson<{ data: NhatKyItem }>(res);
  return json.data;
}

/** Xoá nhật ký */
export async function deleteDiary(manhatky: number): Promise<void> {
  const res = await apiFetch(`/api/student/diary/${manhatky}`, { method: "DELETE" });
  await apiJson<{ success: boolean }>(res);
}
