import { apiFetch } from "@/services/service/auth/auth.service";

// Khớp với các fields mà ChatSidebar & ChatWindow đang dùng
export interface ChatRoom {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  tieude?: string | null;
  loai?: string;
  members?: { mataikhoan: string; email: string; vaitro: string; hoten?: string }[];
}

export interface Message {
  id: number;
  macuoctrochuyen: number;
  mataikhoan: string;
  noidung: string | null;
  content?: string | null;       // alias dùng trong ChatWindow
  filedinh: string | null;
  fileUrl?: string | null;       // alias dùng trong ChatWindow
  fileName?: string | null;      // alias dùng trong ChatWindow
  loaifile?: string | null;
  thoigiangui: string;
  time?: string;                 // alias dùng trong ChatWindow
  dadoc?: boolean;
  isMine: boolean;
  sender?: { email: string; hoten?: string };
}

export async function fetchChatRooms(): Promise<{ data: ChatRoom[] }> {
  const res = await apiFetch("/api/student/messages/conversations");
  if (!res.ok) throw new Error(`Lỗi tải phòng chat (${res.status})`);
  const json = await res.json();
  const data = (json.data ?? json ?? []).map((c: any) => {
    const otherMember = c.otherMembers?.[0];
    const account = otherMember?.taikhoan;
    const name = c.loai === "CaNhan"
      ? (account?.hoten || account?.email || c.tieude || "Không tên")
      : (c.tieude || "Trò chuyện nhóm");

    const role = account?.vaitro === "SinhVien" ? "Sinh viên" : (account?.vaitro === "GiangVien" ? "Giảng viên" : "Quản trị");
    const email = account?.email || "";
    const masv = account?.id_phu || "";
    
    // Convert ngayvaotruong or ngaytao to readable date string
    const rawDate = account?.ngayvaotruong || otherMember?.ngaythamgia;
    const startDate = rawDate ? new Date(rawDate).toLocaleDateString("vi-VN") : "";

    const getFormattedTime = (dateStr: string) => {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}-${mm}`;
    };

    return {
      ...c,
      id: c.macuoctrochuyen,
      name,
      avatar: account?.anhdaidien || "",
      lastMsg: c.lastMsg,
      time: c.lastMsg ? getFormattedTime(c.lastMsg.ngaytao) : "",
      role,
      email,
      masv,
      startDate
    };
  });
  return { data };
}

export async function fetchMessages(
  roomId: number,
  currentMataikhoan: string
): Promise<{ data: Message[] }> {
  const res = await apiFetch(
    `/api/student/messages/conversations/${roomId}?mataikhoan=${currentMataikhoan}`
  );
  if (!res.ok) throw new Error(`Lỗi tải tin nhắn (${res.status})`);
  const json = await res.json();
  const data = (json.data ?? json ?? []).map((m: any) => ({
    ...m,
    id: m.matinnhan,
    content: m.noidung,
    fileUrl: m.filedinh,
    time: m.ngaytao ? new Date(m.ngaytao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "",
    isMine: m.mataikhoangui === currentMataikhoan
  }));
  return { data };
}

export async function sendMessage(
  roomId: number,
  userId: string,
  content: string,
  filedinh?: string
): Promise<{ data: Message }> {
  const res = await apiFetch("/api/student/messages", {
    method: "POST",
    body: JSON.stringify({ macuoctrochuyen: roomId, mataikhoangui: userId, noidung: content, filedinh }),
  });
  if (!res.ok) throw new Error(`Lỗi gửi tin nhắn (${res.status})`);
  const json = await res.json();
  const msgData = json.data ?? json;
  const mappedMsg = {
    ...msgData,
    id: msgData.matinnhan,
    content: msgData.noidung,
    fileUrl: msgData.filedinh,
    time: msgData.ngaytao ? new Date(msgData.ngaytao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    isMine: msgData.mataikhoangui === userId
  };
  return { data: mappedMsg };
}

export async function deleteChatRoom(roomId: number): Promise<{ success: boolean }> {
  const res = await apiFetch(`/api/student/messages/conversations/${roomId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Lỗi xóa phòng chat (${res.status})`);
  return res.json();
}

export async function searchUsers(q: string): Promise<{ data: any[] }> {
  const res = await apiFetch(`/api/student/messages/users?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Lỗi tìm kiếm (${res.status})`);
  return res.json();
}

export async function createChatRoom(
  otherMataikhoan: string
): Promise<{ success: boolean; data: { macuoctrochuyen: number } }> {
  const res = await apiFetch("/api/student/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ otherMataikhoan }),
  });
  if (!res.ok) throw new Error(`Lỗi tạo phòng chat (${res.status})`);
  return res.json();
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/student/messages/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Lỗi upload file (${res.status})`);
  const json = await res.json();
  return json.url ?? json.fileUrl ?? "";
}
