/**
 * services/messages.service.ts
 * Client-side service cho trang tin nhắn — gọi các API /api/messages/*
 */
import { apiFetch } from "./auth.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemberProfile {
  masv: string | null;
  magv: string | null;
  hoten: string;
  anhdaidien: string | null;
  emailtruong?: string | null;
}

export interface ConversationMember {
  masv: string | null;
  magv: string | null;
  vaitro: string | null;
  ngaythamgia: string;
  thoigianxemcuoi: string | null;
  sinhvien: MemberProfile | null;
  giangvien: MemberProfile | null;
  isSelf?: boolean;
}

export interface LastMessage {
  matinnhan: number;
  noidung: string;
  masvgui: string | null;
  magvgui: string | null;
  ngaytao: string;
}

export interface ConversationRow {
  macuoctrochuyen: number;
  tieude: string | null;
  loai: "Rieng" | "NhomMon";
  ngaytao: string;
  members: ConversationMember[];
  otherMembers: ConversationMember[];
  lastMsg: LastMessage | null;
  unread: number;
}

export interface MessageSenderProfile {
  masv?: string;
  magv?: string;
  hoten: string;
  anhdaidien: string | null;
}

export interface MessageRow {
  matinnhan: number;
  macuoctrochuyen: number;
  masvgui: string | null;
  magvgui: string | null;
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
  me: { masv: string | null; magv: string | null };
}

export interface UserSearchResult {
  id: string;
  masv: string | null;
  magv: string | null;
  hoten: string;
  avatar: string | null;
  email: string | null;
  role: "SinhVien" | "GiangVien";
  extra: string | null; // tên lớp hoặc khoa
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * Lấy danh sách cuộc trò chuyện của user hiện tại.
 */
export async function getConversations(): Promise<ConversationRow[]> {
  const res = await apiFetch("/api/student/messages/conversations");
  const json = await apiJson<{ data: ConversationRow[] }>(res);
  return json.data;
}

/**
 * Tạo hoặc lấy cuộc trò chuyện 1-1 với người dùng khác.
 */
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

/**
 * Lấy tin nhắn trong cuộc trò chuyện (phân trang).
 */
export async function getMessages(
  conversationId: number,
  page = 1,
  limit = 30
): Promise<MessagesResponse> {
  const q = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}?${q}`);
  return apiJson<MessagesResponse>(res);
}

/**
 * Gửi tin nhắn trong cuộc trò chuyện.
 */
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

/**
 * Upload file/ảnh đính kèm lên Supabase Storage.
 * Trả về URL công khai của file.
 */
export async function uploadAttachment(file: File): Promise<{ url: string; name: string; type: string; size: number }> {
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

/**
 * Xóa toàn bộ hội thoại.
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}`, { method: "DELETE" });
  await apiJson<{ success: boolean }>(res);
}

/**
 * Lấy danh sách thành viên trong cuộc trò chuyện.
 */
export async function getConversationMembers(conversationId: number): Promise<ConversationMember[]> {
  const res = await apiFetch(`/api/student/messages/conversations/${conversationId}/members`);
  const json = await apiJson<{ data: ConversationMember[] }>(res);
  return json.data;
}

/**
 * Tìm kiếm người dùng để bắt đầu cuộc trò chuyện mới.
 */
export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const q = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await apiFetch(`/api/student/messages/users?${q}`);
  const json = await apiJson<{ data: UserSearchResult[] }>(res);
  return json.data;
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────

/**
 * Lấy tên hiển thị của cuộc trò chuyện (từ tên người kia hoặc tiêu đề nhóm).
 */
export function getConversationDisplayName(conv: ConversationRow, selfMasv: string | null, selfMagv: string | null): string {
  if (conv.tieude) return conv.tieude;
  if (conv.loai === "Rieng" && conv.otherMembers.length > 0) {
    const other = conv.otherMembers[0];
    return other.sinhvien?.hoten ?? other.giangvien?.hoten ?? "Người dùng";
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
  const d   = new Date(isoStr);
  const now = new Date();
  const diffMs  = now.getTime() - d.getTime();
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDay === 0) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDay === 1) return "Hôm qua";
  if (diffDay < 7) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return days[d.getDay()];
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
