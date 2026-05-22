import { studentFetch } from "./client";

export interface Message {
  id: number;
  matinnhan: number;
  macuoctrochuyen: number;
  mataikhoangui: string;
  isMine: boolean;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  time: string;
  ngaytao: string;
}

export interface ChatRoom {
  id: number;
  macuoctrochuyen: number;
  name: string;
  avatar: string;
  time: string;
  unread: number;
  lastMsg: string;
  loai: "CaNhan" | "Nhom";
  ngaytao: string;
  members: any[];
  otherMembers: any[];
}

function mapRawMessage(raw: any, currentMataikhoan: string): Message {
  const fileUrl = raw.filedinh || null;
  let fileName: string | null = null;
  if (fileUrl) {
    fileName = fileUrl.split("/").pop()?.replace(/^\d+_/, "") || "Tệp đính kèm";
  }
  const time = raw.ngaytao
    ? new Date(raw.ngaytao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  return {
    id: raw.matinnhan,
    matinnhan: raw.matinnhan,
    macuoctrochuyen: raw.macuoctrochuyen,
    mataikhoangui: raw.mataikhoangui,
    isMine: raw.mataikhoangui === currentMataikhoan,
    content: raw.noidung || "",
    fileUrl,
    fileName,
    time,
    ngaytao: raw.ngaytao,
  };
}

export async function fetchChatRooms(currentMataikhoan: string = ""): Promise<{ success: boolean; data: ChatRoom[] }> {
  const res = await studentFetch("/api/student/messages/conversations");
  const json = await res.json();
  if (!json.data) return { success: true, data: [] };

  const data = json.data.map((conv: any) => {
    const otherMember = conv.otherMembers?.[0];
    const name = conv.loai === "Nhom"
      ? (conv.tieude ?? "Nhóm trò chuyện")
      : otherMember
        ? (otherMember.sinhvien?.hoten || otherMember.giangvien?.hoten || "Người dùng")
        : "Người dùng";
    const avatar = conv.loai === "Nhom"
      ? "👥"
      : otherMember
        ? (otherMember.sinhvien?.anhdaidien || otherMember.giangvien?.anhdaidien || "👤")
        : "👤";
    const lastMsgText = conv.lastMsg
      ? (conv.lastMsg.filedinh ? "[Tệp đính kèm]" : conv.lastMsg.noidung)
      : "Chưa có tin nhắn";
    const rawTime = conv.lastMsg ? conv.lastMsg.ngaytao : conv.ngaytao;
    const time = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

    return {
      id: conv.macuoctrochuyen,
      macuoctrochuyen: conv.macuoctrochuyen,
      name,
      avatar,
      time,
      unread: conv.unread ?? 0,
      lastMsg: lastMsgText,
      loai: conv.loai,
      ngaytao: conv.ngaytao,
      members: conv.members ?? [],
      otherMembers: conv.otherMembers ?? [],
    };
  });

  return { success: true, data };
}

export async function fetchMessages(roomId: number, currentMataikhoan: string): Promise<{ data: Message[] }> {
  const res = await studentFetch(`/api/student/messages/conversations/${roomId}`);
  const json = await res.json();
  const rawList = json.data ?? [];
  return {
    data: rawList.map((raw: any) => mapRawMessage(raw, currentMataikhoan))
  };
}

export async function sendMessage(
  roomId: number,
  userId: string,
  content: string,
  filedinh?: string
): Promise<{ data: Message }> {
  const res = await studentFetch(`/api/student/messages/conversations/${roomId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ noidung: content, filedinh }),
  });
  const json = await res.json();
  return {
    data: mapRawMessage(json.data, userId)
  };
}

export async function deleteChatRoom(roomId: number) {
  const res = await studentFetch(`/api/student/messages/conversations/${roomId}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function searchUsers(q: string) {
  const res = await studentFetch(`/api/student/messages/users?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function createChatRoom(otherMataikhoan: string) {
  const res = await studentFetch("/api/student/messages/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ otherMataikhoan }),
  });
  return res.json();
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await studentFetch("/api/student/messages/upload", {
    method: "POST",
    body: form,
  });
  const json = await res.json();
  if (!json.url) {
    throw new Error(json.error || "Upload file tin nhắn thất bại.");
  }
  return json.url;
}

