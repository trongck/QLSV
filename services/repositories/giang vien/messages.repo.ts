/**
 * services/repositories/messages.repo.ts
 * Tầng truy cập dữ liệu cho tính năng Tin nhắn (Sinh viên).
 * Gọi trực tiếp các API /api/student/messages/* và trả về JSON.
 */
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "./api.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberProfile {
  mataikhoan: string;
  email: string | null;
  vaitro: string | null;
  // Optional resolved profile
  hoten?: string;
  anhdaidien?: string | null;
}

export interface ConversationMember {
  mataikhoan: string;
  vaitro: string | null;
  ngaythamgia: string;
  thoigianxemcuoi: string | null;
  taikhoan: MemberProfile | null;
  isSelf?: boolean;
}

export interface LastMessage {
  matinnhan: number;
  noidung: string;
  mataikhoangui: string;
  ngaytao: string;
}

export interface ConversationRow {
  macuoctrochuyen: number;
  tieude: string | null;
  loai: "CaNhan" | "Nhom";
  ngaytao: string;
  members: ConversationMember[];
  otherMembers: ConversationMember[];
  lastMsg: LastMessage | null;
  unread: number;
}

export interface MessageRow {
  matinnhan: number;
  macuoctrochuyen: number;
  mataikhoangui: string;
  noidung: string;
  filedinh: string | null;
  dachinh: boolean;
  ngaytao: string;
}

export interface MessagesResponse {
  data: MessageRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  me: { mataikhoan: string };
}

export interface UserSearchResult {
  id: string;
  masv: string | null;
  magv: string | null;
  hoten: string;
  avatar: string | null;
  email: string | null;
  role: "SinhVien" | "GiangVien";
  extra: string | null;
}

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy danh sách cuộc trò chuyện của user hiện tại */
export async function getConversations(): Promise<ConversationRow[]> {
  const res = await apiFetch("/api/student/messages/conversations");
  const json = await apiJson<{ data: ConversationRow[] }>(res);
  return json.data;
}

/** Tạo hoặc lấy cuộc trò chuyện 1-1 */
export async function createOrGetConversation(
  otherMasv?: string,
  otherMagv?: string
): Promise<{ data: { macuoctrochuyen: number; tieude: string | null; loai: string; ngaytao: string }; existed: boolean }> {
  const res = await apiFetch("/api/student/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ otherMasv: otherMasv ?? null, otherMagv: otherMagv ?? null }),
  });
  return apiJson(res);
}

/** Lấy tin nhắn trong cuộc trò chuyện (phân trang) */
export async function getMessages(
  conversationId: number,
  page = 1,
  limit = 30
): Promise<MessagesResponse> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}?${q}`);
  return apiJson<MessagesResponse>(res);
}

/** Gửi tin nhắn trong cuộc trò chuyện */
export async function sendMessage(
  conversationId: number,
  noidung: string,
  filedinh?: string
): Promise<MessageRow> {
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}`, {
    method: "POST",
    body: JSON.stringify({ noidung, filedinh: filedinh ?? null }),
  });
  const json = await apiJson<{ data: MessageRow }>(res);
  return json.data;
}

/** Upload file/ảnh đính kèm lên Supabase Storage */
export async function uploadAttachment(
  file: File
): Promise<{ url: string; name: string; type: string; size: number }> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/student/messages/upload", { method: "POST", body: form });
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    const msg = ct.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { error?: string }).error
      : undefined;
    throw new Error(msg ?? `Lỗi upload ${res.status}`);
  }
  return res.json();
}

/** Xóa toàn bộ hội thoại (ẩn với user) */
export async function deleteConversation(conversationId: number): Promise<void> {
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}`, { method: "DELETE" });
  await apiJson<{ success: boolean }>(res);
}

/** Xóa một tin nhắn cụ thể (ẩn với user) */
export async function deleteMessage(messageId: number): Promise<void> {
  const res = await apiFetch(`/api/student/messages/${messageId}`, { method: "DELETE" });
  await apiJson<{ success: boolean }>(res);
}

/** Lấy danh sách thành viên trong cuộc trò chuyện */
export async function getConversationMembers(conversationId: number): Promise<ConversationMember[]> {
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}/members`);
  const json = await apiJson<{ data: ConversationMember[] }>(res);
  return json.data;
}

/** Tìm kiếm người dùng để bắt đầu cuộc trò chuyện mới */
export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const q = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await apiFetch(`/api/student/messages/users?${q}`);
  const json = await apiJson<{ data: UserSearchResult[] }>(res);
  return json.data;
}
