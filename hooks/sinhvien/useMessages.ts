"use client";

import React, { useState, useCallback } from "react";
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
  content: React.ReactNode;
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
      const res = await apiFetch("/api/student/messages/conversations");
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        const mapped = json.data.map((room: any) => {
          const otherMember = room.otherMembers?.[0];

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
          let previewTime = room.ngaytao ? new Date(room.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "";

          if (room.lastMsg) {
            previewText = room.lastMsg.noidung;
            previewTime = new Date(room.lastMsg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
          }

          return {
            id: room.macuoctrochuyen,
            name,
            avatar: name !== "Phòng chat" ? "👤" : "👥",
            time: previewTime,
            lastMsg: previewText,
            unread: room.unread ?? 0,
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
      const res = await apiFetch("/api/student/messages/conversations");
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        const mapped = json.data.map((room: any) => {
          const otherMember = room.otherMembers?.[0];

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
          let previewTime = room.ngaytao ? new Date(room.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "";

          if (room.lastMsg) {
            previewText = room.lastMsg.noidung;
            previewTime = new Date(room.lastMsg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
          }

          return {
            id: room.macuoctrochuyen,
            name,
            avatar: name !== "Phòng chat" ? "👤" : "👥",
            time: previewTime,
            lastMsg: previewText,
            unread: room.unread ?? 0,
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
      const res = await apiFetch(`/api/student/messages?roomId=${roomId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {

        const mapped = json.data.map((msg: any) => {
          const isMine = msg.mataikhoangui === currentMataikhoan;
          return {
            id: msg.matinnhan,
            content: msg.filedinh ? React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: "5px" } },
              /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(msg.filedinh) ? React.createElement(
                "img",
                {
                  src: msg.filedinh,
                  alt: "ảnh",
                  style: { maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", objectFit: "cover", border: "1px solid #eee" }
                }
              ) : null,
              React.createElement(
                "a",
                {
                  href: msg.filedinh,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  style: {
                    color: isMine ? "#000000ff" : "#E57373",
                    textDecoration: "underline",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px"
                  }
                },
                "📁 ",
                extractFileName(msg.filedinh) || "Tải xuống tệp"
              )
            ) : msg.noidung,
            time: new Date(msg.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
            isMine,
            type: "text", // Mặc định là text
          };
        });

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
      const res = await apiFetch(`/api/student/messages?roomId=${roomId}`);
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
      const res = await apiFetch("/api/student/messages", {
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
          content: json.data.filedinh ? React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: "5px" } },
            /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(json.data.filedinh) ? React.createElement(
              "img",
              {
                src: json.data.filedinh,
                alt: "ảnh",
                style: { maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", objectFit: "cover", border: "1px solid #eee" }
              }
            ) : null,
            React.createElement(
              "a",
              {
                href: json.data.filedinh,
                target: "_blank",
                rel: "noopener noreferrer",
                style: {
                  color: "#FFFFFF",
                  textDecoration: "underline",
                  fontWeight: "bold",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px"
                }
              },
              "📁 ",
              extractFileName(json.data.filedinh) || "Tải xuống tệp"
            )
          ) : json.data.noidung,
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
      const res = await apiFetch(`/api/student/messages/conversations/${roomId}`, {
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
