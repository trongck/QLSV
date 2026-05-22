"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMessages } from "@/hooks/sinhvien/useMessages";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MessagesLayout } from "@/components/student/messages/MessagesLayout";
import { ChatSidebar } from "@/components/student/messages/ChatSidebar";
import { ChatWindow } from "@/components/student/messages/ChatWindow";
import { ChatInfoPanel } from "@/components/student/messages/ChatInfoPanel";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const CURRENT_USER_ID = user?.mataikhoan || "";

  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const {
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
    isUploading,
    uploadError,
    setUploadError,
    searchUsers,
    createChat,
    sendWithFile,
  } = useMessages(CURRENT_USER_ID);

  const [pendingFile, setPendingFile] = useState<{ file: File; url: string } | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);

  // Debounced search for users or default suggestions
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      if (isSearchActive) {
        const loadSuggestions = async () => {
          const results = await searchUsers("");
          setSearchResults(results);
        };
        loadSuggestions();
      } else {
        setSearchResults([]);
      }
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchUsers, isSearchActive]);

  const handleCreateChat = async (otherMataikhoan: string) => {
    const roomId = await createChat(otherMataikhoan);
    if (roomId) {
      setShowChatMobile(true);
      setSearchTerm("");
      setSearchResults([]);
      setIsSearchActive(false);
    }
  };

  const handleStartNewChat = async () => {
    setIsSearchActive(true);
    const input = document.getElementById("chat-search-input");
    if (input) {
      input.focus();
    }
    const results = await searchUsers("");
    setSearchResults(results);
  };

  const handleFocusSearch = async () => {
    setIsSearchActive(true);
    if (searchTerm.trim() === "") {
      const results = await searchUsers("");
      setSearchResults(results);
    }
  };

  const handleCloseSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearchActive(false);
  };

  // Poll chat rooms
  useEffect(() => {
    fetchChatRooms();

    const interval = setInterval(() => {
      pollChatRooms();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchChatRooms, pollChatRooms]);

  // Poll messages
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);

      const interval = setInterval(() => {
        pollMessages(selectedChatId);
      }, 3000);

      return () => clearInterval(interval);
    } else if (chatList.length > 0) {
      setSelectedChatId(chatList[0]?.id ?? null);
    }
  }, [selectedChatId, fetchMessages, pollMessages, chatList, setSelectedChatId]);

  // Handle Send message
  const handleSend = async () => {
    if ((!inputText.trim() && !pendingFile) || !selectedChatId) return;
    setUploadError(null);

    if (pendingFile) {
      const success = await sendWithFile(selectedChatId, CURRENT_USER_ID, inputText, pendingFile.file);
      if (success) {
        setPendingFile(null);
        setInputText("");
      }
    } else {
      await sendMessage(selectedChatId, CURRENT_USER_ID, inputText);
      setInputText("");
    }
  };

  const handleFileSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPendingFile({ file, url: previewUrl });
  };

  const selectedChatInfo = chatList.find((c) => c.id === selectedChatId) || chatList[0] || {};

  if (authLoading || (isLoading && chatList.length === 0)) {
    return <div className="flex h-full items-center justify-center bg-[#FDF8F6]">Đang tải dữ liệu...</div>;
  }

  return (
    <DashboardShell pageTitle="Tin nhắn" fullWidth={true}>
      <MessagesLayout>
        {/* Page title */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>
            Hộp thư &amp; Tin nhắn trao đổi
          </h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>
            Trao đổi trực tiếp với sinh viên và đồng nghiệp qua kênh tin nhắn nội bộ
          </p>
        </div>

        {/* 3-Column Message System Layout */}
        <section className={`card msg-layout ${showChatMobile ? "show-chat" : "show-list"}`}>
          <ChatSidebar
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchResults={searchResults}
            onSelectSearchResult={handleCreateChat}
            chatList={chatList}
            selectedChatId={selectedChatId}
            onSelectChat={(id) => {
              setSelectedChatId(id);
              setShowChatMobile(true);
            }}
            isSearchActive={isSearchActive}
            onFocusSearch={handleFocusSearch}
            onCloseSearch={handleCloseSearch}
          />

          {chatList.length === 0 ? (
            <div className="msg-main" style={{ alignItems: "center", justifyContent: "center" }}>
              <h3 style={{ color: "#6B4F43", marginBottom: "16px", fontWeight: "bold" }}>
                Hiện tại chưa có tin nhắn
              </h3>
              <button
                onClick={handleStartNewChat}
                style={{
                  padding: "10px 20px",
                  background: "#F2A8A8",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(242, 168, 168, 0.4)",
                }}
              >
                Tạo hội thoại mới
              </button>
            </div>
          ) : (
            <>
              <ChatWindow
                selectedChatId={selectedChatId}
                selectedChatInfo={selectedChatInfo}
                messages={messages}
                onBack={() => setShowChatMobile(false)}
                onDeleteChat={deleteChatRoom}
                inputText={inputText}
                onInputTextChange={setInputText}
                onSend={handleSend}
                onFileSelect={handleFileSelect}
                pendingFile={pendingFile}
                onRemovePendingFile={() => {
                  setPendingFile(null);
                  setUploadError(null);
                }}
                isUploading={isUploading}
                uploadError={uploadError}
              />

              <ChatInfoPanel selectedChatInfo={selectedChatInfo} />
            </>
          )}
        </section>
      </MessagesLayout>
    </DashboardShell>
  );
}