"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ChatRoom {
  id: number;
  name: string;
  avatar: string;
  time: string;
  lastMsg: string;
  unread: number;
  role: string;
  email?: string;
  startDate?: string;
}

export interface Message {
  id: number;
  content: string;
  time: string;
  isMine: boolean;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
}

const extractFileName = (url: string | undefined | null) => {
  if (!url) return undefined;
  try {
    const urlObj = new URL(url);
    const nameParam = urlObj.searchParams.get('name');
    if (nameParam) return decodeURIComponent(nameParam);
  } catch (e) { }
  return url.split('/').pop()?.split('?')[0];
};

export function useMessages(currentMataikhoan: string) {
  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");

  const fetchChatRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/sinhvien/chat-rooms");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((item: any) => {
          const room = item.cuoctrochuyen;
          const otherMember = room.thanhvientrochuyen?.find((m: any) => m.mataikhoan !== currentMataikhoan);

          let name = room.tieude;
          let role = "Thành viên";
          let email = "";

          if (!name || name === "Phòng chat") {
            if (otherMember?.giangvien) {
              name = otherMember.giangvien.hoten;
              role = "Giảng viên";
              email = otherMember.giangvien.emailtruong || "";
            } else if (otherMember?.sinhvien) {
              name = otherMember.sinhvien.hoten;
              role = "Sinh viên";
              email = otherMember.sinhvien.emailtruong || "";
            } else {
              name = "Phòng chat";
            }
          }

          // Ngày bắt đầu format dd/MM/yyyy
          const startDateStr = room.ngaytao ? new Date(room.ngaytao).toLocaleDateString("vi-VN") : "";

          let previewText = "Bắt đầu cuộc trò chuyện...";
          let previewTime = new Date(room.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

          if (room.lastMsg) {
            previewText = room.lastMsg.noidung;
            previewTime = new Date(room.lastMsg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
          }

          return {
            id: item.macuoctrochuyen,
            name,
            avatar: name !== "Phòng chat" ? "👤" : "👥",
            time: previewTime,
            lastMsg: previewText,
            unread: 0,
            role,
            email,
            startDate: startDateStr,
          };
        });
        setChatList(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMataikhoan]);

  // Polling for chat rooms (silent, no loading state)
  const pollChatRooms = useCallback(async () => {
    try {
      const res = await apiFetch("/api/sinhvien/chat-rooms");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((item: any) => {
          const room = item.cuoctrochuyen;
          const otherMember = room.thanhvientrochuyen?.find((m: any) => m.mataikhoan !== currentMataikhoan);

          let name = room.tieude;
          let role = "Thành viên";
          let email = "";

          if (!name || name === "Phòng chat") {
            if (otherMember?.giangvien) {
              name = otherMember.giangvien.hoten;
              role = "Giảng viên";
              email = otherMember.giangvien.emailtruong || "";
            } else if (otherMember?.sinhvien) {
              name = otherMember.sinhvien.hoten;
              role = "Sinh viên";
              email = otherMember.sinhvien.emailtruong || "";
            } else {
              name = "Phòng chat";
            }
          }

          const startDateStr = room.ngaytao ? new Date(room.ngaytao).toLocaleDateString("vi-VN") : "";

          let previewText = "Bắt đầu cuộc trò chuyện...";
          let previewTime = new Date(room.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });

          if (room.lastMsg) {
            previewText = room.lastMsg.noidung;
            previewTime = new Date(room.lastMsg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
          }

          return {
            id: item.macuoctrochuyen,
            name,
            avatar: name !== "Phòng chat" ? "👤" : "👥",
            time: previewTime,
            lastMsg: previewText,
            unread: 0,
            role,
            email,
            startDate: startDateStr,
          };
        });
        // Only update if there are changes to avoid unnecessary re-renders
        setChatList(prev => JSON.stringify(prev) !== JSON.stringify(mapped) ? mapped : prev);
      }
    } catch (error) {
      // ignore polling errors
    }
  }, [currentMataikhoan]);

  const fetchMessages = useCallback(async (roomId: number) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/sinhvien/messages?roomId=${roomId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((msg: any) => ({
          id: msg.matinnhan,
          content: msg.noidung,
          time: new Date(msg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
          isMine: msg.mataikhoangui === currentMataikhoan,
          type: msg.filedinh ? "file" as const : "text" as const,
          fileName: extractFileName(msg.filedinh),
          fileUrl: msg.filedinh || undefined,
        }));
        setMessages(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMataikhoan]);

  // Polling for messages (silent)
  const pollMessages = useCallback(async (roomId: number) => {
    try {
      const res = await apiFetch(`/api/sinhvien/messages?roomId=${roomId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped = json.data.map((msg: any) => ({
          id: msg.matinnhan,
          content: msg.noidung,
          time: new Date(msg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
          isMine: msg.mataikhoangui === currentMataikhoan,
          type: msg.filedinh ? "file" as const : "text" as const,
          fileName: extractFileName(msg.filedinh),
          fileUrl: msg.filedinh || undefined,
        }));
        setMessages(prev => {
          if (prev.length !== mapped.length) return mapped;
          const lastPrev = prev[prev.length - 1];
          const lastMapped = mapped[mapped.length - 1];
          if (lastPrev?.id !== lastMapped?.id) return mapped;
          return prev;
        });
      }
    } catch (error) {
      // ignore polling errors
    }
  }, [currentMataikhoan]);

  const sendMessage = useCallback(async (roomId: number, userId: string, content: string, filedinh?: string) => {
    try {
      const res = await apiFetch("/api/sinhvien/messages", {
        method: "POST",
        body: JSON.stringify({
          macuoctrochuyen: roomId,
          mataikhoangui: userId,
          noidung: content || (filedinh ? "" : ""),
          filedinh: filedinh || null,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newMsg = {
          id: json.data.matinnhan,
          content: json.data.noidung,
          time: new Date(json.data.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
          isMine: true,
          type: json.data.filedinh ? "file" as const : "text" as const,
          fileName: extractFileName(json.data.filedinh),
          fileUrl: json.data.filedinh || undefined,
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, []);

  const deleteChatRoom = useCallback(async (roomId: number) => {
    try {
      const res = await apiFetch(`/api/sinhvien/chat-rooms?roomId=${roomId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setChatList((prev) => prev.filter((c) => c.id !== roomId));
        if (selectedChatId === roomId) {
          setSelectedChatId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  }, [selectedChatId]);

  return {
    chatList,
    messages,
    isLoading,
    fetchChatRooms,
    pollChatRooms,
    fetchMessages,
    pollMessages,
    sendMessage,
    deleteChatRoom,
    selectedChatId,
    setSelectedChatId,
    inputText,
    setInputText,
  };
}
