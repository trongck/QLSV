"use client";

import { useState, useCallback } from "react";
import {
  fetchChatRooms as fetchChatRoomsApi,
  fetchMessages as fetchMessagesApi,
  sendMessage as sendMessageApi,
  deleteChatRoom as deleteChatRoomApi,
  searchUsers as searchUsersApi,
  createChatRoom as createChatRoomApi,
  uploadFile as uploadFileApi,
  ChatRoom,
  Message,
} from "@/app/api/sinhvien/messages.api";

export type { ChatRoom, Message };

export function useMessages(currentMataikhoan: string) {
  const [chatList, setChatList] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  // ─── Chat Rooms ─────────────────────────────────────────────────────────────

  const fetchChatRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await fetchChatRoomsApi();
      setChatList(data);
    } catch (error) {
      console.error("Failed to fetch chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Polling phòng chat (không hiển thị loading) */
  const pollChatRooms = useCallback(async () => {
    try {
      const { data } = await fetchChatRoomsApi();
      setChatList(prev =>
        JSON.stringify(prev) !== JSON.stringify(data) ? data : prev
      );
    } catch {
      // bỏ qua lỗi polling
    }
  }, []);

  // ─── Messages ────────────────────────────────────────────────────────────────

  const fetchMessages = useCallback(async (roomId: number) => {
    setIsLoading(true);
    try {
      const { data } = await fetchMessagesApi(roomId, currentMataikhoan);
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentMataikhoan]);

  /** Polling tin nhắn mới (không hiển thị loading) */
  const pollMessages = useCallback(async (roomId: number) => {
    try {
      const { data } = await fetchMessagesApi(roomId, currentMataikhoan);
      setMessages(prev => {
        const lastPrev = prev[prev.length - 1];
        const lastMapped = data[data.length - 1];
        if (prev.length !== data.length || lastPrev?.id !== lastMapped?.id) {
          return data;
        }
        return prev;
      });
    } catch {
      // bỏ qua lỗi polling
    }
  }, [currentMataikhoan]);

  const sendMessage = useCallback(async (
    roomId: number,
    userId: string,
    content: string,
    filedinh?: string
  ) => {
    try {
      const { data: newMsg } = await sendMessageApi(roomId, userId, content, filedinh);
      setMessages(prev => [...prev, newMsg]);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }, []);

  // ─── Chat Room Actions ───────────────────────────────────────────────────────

  const deleteChatRoom = useCallback(async (roomId: number) => {
    try {
      const json = await deleteChatRoomApi(roomId);
      if (json.success) {
        setChatList(prev => prev.filter(c => c.id !== roomId));
        if (selectedChatId === roomId) {
          setSelectedChatId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  }, [selectedChatId]);

  // ─── Search & Create ─────────────────────────────────────────────────────────

  const searchUsers = useCallback(async (q: string): Promise<any[]> => {
    if (!q.trim()) return [];
    try {
      const json = await searchUsersApi(q);
      return json.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const createChat = useCallback(async (otherMataikhoan: string): Promise<number | null> => {
    try {
      const json = await createChatRoomApi(otherMataikhoan);
      if (json?.data) {
        await fetchChatRooms();
        setSelectedChatId(json.data.macuoctrochuyen);
        return json.data.macuoctrochuyen;
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
    return null;
  }, [fetchChatRooms]);

  // ─── File Upload + Send ──────────────────────────────────────────────────────

  /** Upload file rồi gửi kèm tin nhắn */
  const sendWithFile = useCallback(async (
    roomId: number,
    userId: string,
    content: string,
    file: File
  ): Promise<boolean> => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const fileUrl = await uploadFileApi(file);
      await sendMessage(roomId, userId, content, fileUrl);
      return true;
    } catch (err: any) {
      setUploadError(err.message ?? "Lỗi kết nối khi upload file.");
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [sendMessage]);

  // ─── Return ──────────────────────────────────────────────────────────────────

  return {
    chatList,
    messages,
    isLoading,
    isUploading,
    uploadError,
    setUploadError,
    selectedChatId,
    setSelectedChatId,
    fetchChatRooms,
    pollChatRooms,
    fetchMessages,
    pollMessages,
    sendMessage,
    deleteChatRoom,
    searchUsers,
    createChat,
    sendWithFile,
  };
}
