"use client";

import { useState, useCallback } from "react";
import { apiFetch } from "@/services/auth.service";

export interface ChatRoom {
  id: number;
  name: string;
  avatar: string;
  time: string;
  lastMsg: string;
  unread: number;
  role: string;
}

export interface Message {
  id: number;
  content: string;
  time: string;
  isMine: boolean;
  type: "text" | "file";
  fileName?: string;
  fileSize?: string;
}

export function useMessages(currentMasv: string) {
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
          // Lấy tên người kia trong phòng (nếu là chat 1-1)
          const otherMember = room.thanhvientrochuyen?.find((m: any) => (m.masv && m.masv !== currentMasv) || m.magv);
          const name = otherMember?.giangvien?.hoten || otherMember?.sinhvien?.hoten || room.tieude || "Phòng chat";
          
          return {
            id: item.macuoctrochuyen,
            name: name,
            avatar: name.charAt(0).toUpperCase(),
            time: new Date(room.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
            lastMsg: "Bắt đầu cuộc trò chuyện...",
            unread: 0,
            role: otherMember?.magv ? "Giảng viên" : "Sinh viên",
          };
        });
        setChatList(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMasv]);

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
          isMine: msg.masvgui === currentMasv,
          type: "text", // Mặc định là text
        }));
        setMessages(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMasv]);

  const sendMessage = useCallback(async (roomId: number, userId: string, content: string) => {
    try {
      const res = await apiFetch("/api/sinhvien/messages", {
        method: "POST",
        body: JSON.stringify({
          macuoctrochuyen: roomId,
          masvgui: userId,
          noidung: content,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newMsg = {
          id: json.data.matinnhan,
          content: json.data.noidung,
          time: new Date(json.data.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
          isMine: true,
          type: "text" as const,
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, []);

  return {
    chatList,
    messages,
    isLoading,
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    selectedChatId,
    setSelectedChatId,
    inputText,
    setInputText,
  };
}
