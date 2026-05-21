"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMessages } from "@/hooks/sinhvien/useMessages"; 
import { apiFetch, tokenStorage } from "@/services/service/auth/auth.service";
import {
  Search,
  Edit3,
  Paperclip,
  Trash2,
  FileText,
  Send,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function MessagesPage() {
  // 1. Gọi các state và hàm từ Hook
  const { user, loading: authLoading } = useAuth();
  const CURRENT_USER_ID = user?.mataikhoan || "";

  // 1. Gọi các state và hàm từ Hook
  const { 
    chatList, messages, isLoading, 
    fetchChatRooms, pollChatRooms, 
    fetchMessages, pollMessages, 
    sendMessage, deleteChatRoom, selectedChatId, setSelectedChatId, 
    inputText, setInputText 
  } = useMessages(CURRENT_USER_ID);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingFile, setPendingFile] = useState<{file: File; url: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search for users
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/student/messages/users?q=${encodeURIComponent(searchTerm)}`);
        const json = await res.json();
        if (json.data) {
          setSearchResults(json.data);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleCreateChat = async (otherMataikhoan: string) => {
    try {
      const res = await apiFetch("/api/student/messages/conversations", {
        method: "POST",
        body: JSON.stringify({ otherMataikhoan })
      });
      const json = await res.json();
      if (json.data) {
        // Refresh chat list
        await fetchChatRooms();
        setSelectedChatId(json.data.macuoctrochuyen);
        setShowChatMobile(true);
        setSearchTerm("");
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  // 3. Tải danh sách phòng khi vừa vào trang và thiết lập Polling
  useEffect(() => {
    fetchChatRooms();
    
    // Polling danh sách chat mỗi 5 giây
    const interval = setInterval(() => {
      pollChatRooms();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchChatRooms, pollChatRooms]);

  // 4. Tải tin nhắn mới mỗi khi người dùng click chọn phòng chat khác
  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId);
      
      // Polling tin nhắn mới mỗi 3 giây
      const interval = setInterval(() => {
        pollMessages(selectedChatId);
      }, 3000);
      
      return () => clearInterval(interval);
    } else if (chatList.length > 0) {
      // Nếu chưa chọn ai, tự động chọn người đầu tiên trong danh sách
      setSelectedChatId(chatList[0].id);
    }
  }, [selectedChatId, fetchMessages, pollMessages, chatList]);

  // 5. Hàm xử lý khi bấm nút Gửi
  const handleSend = async () => {
    if ((!inputText.trim() && !pendingFile) || !selectedChatId) return;
    setUploadError(null);
    
    if (pendingFile) {
      setIsUploading(true);
      try {
        const token = tokenStorage.getAccessToken() || '';
        const formData = new FormData();
        formData.append('file', pendingFile.file);
        const res = await fetch('/api/sinhvien/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const json = await res.json();
        if (json.success) {
          const finalUrl = `${json.url}?name=${encodeURIComponent(json.fileName)}`;
          await sendMessage(selectedChatId, CURRENT_USER_ID, inputText || '', finalUrl);
          setPendingFile(null);
          setInputText('');
        } else {
          setUploadError(json.message || 'Upload thất bại. Kiểm tra bucket "attachments" trong Supabase Storage.');
        }
      } catch (err: any) {
        console.error('Upload failed:', err);
        setUploadError('Lỗi kết nối khi upload file.');
      } finally {
        setIsUploading(false);
      }
    } else {
      sendMessage(selectedChatId, CURRENT_USER_ID, inputText);
      setInputText('');
    }
  };

  // Xử lý chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingFile({ file, url: previewUrl });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 6. Lấy thông tin của người đang được chọn để hiển thị trên Header
  const selectedChatInfo = chatList.find((c) => c.id === selectedChatId) || chatList[0] || {};

  if (authLoading || (isLoading && chatList.length === 0)) {
    return <div className="flex h-full items-center justify-center bg-[#FDF8F6]">Đang tải dữ liệu...</div>;
  }

  // =======================================================================
  // PHẦN RETURN GIAO DIỆN CỦA BẠN (Đã được nối với dữ liệu thật)
  // =======================================================================
  return (
    <DashboardShell pageTitle="Tin nhắn" fullWidth={true}>
      <style>{`
        .msg-container {
          padding: 24px 32px;
          height: calc(100vh - 90px);
          display: flex;
          flex-direction: column;
        }
        .msg-layout {
          display: flex;
          padding: 0;
          flex: 1;
          overflow: hidden;
          border: 1px solid #EAE0DA;
          border-radius: 12px;
          background: #FFF;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .msg-sidebar-left {
          width: 280px;
          border-right: 1px solid #EAE0DA;
          display: flex;
          flex-direction: column;
          background: #FAFAFA;
          flex-shrink: 0;
        }
        .msg-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #FAF9F8;
          min-width: 0;
        }
        .msg-sidebar-right {
          width: 260px;
          border-left: 1px solid #EAE0DA;
          padding: 24px;
          display: flex;
          flex-direction: column;
          background: #FFF;
          flex-shrink: 0;
          overflow-y: auto;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .msg-sidebar-right {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .msg-container {
            padding: 12px;
            height: calc(100vh - 60px);
          }
          .msg-layout {
            flex-direction: column;
            height: 100%;
          }
          
          /* When showing list (hide chat panel) */
          .msg-layout.show-list .msg-sidebar-left {
            width: 100%;
            height: 100%;
            display: flex;
            border-right: none;
            border-bottom: none;
          }
          .msg-layout.show-list .msg-main {
            display: none !important;
          }
          
          /* When showing chat panel (hide list panel) */
          .msg-layout.show-chat .msg-sidebar-left {
            display: none !important;
          }
          .msg-layout.show-chat .msg-main {
            width: 100%;
            height: 100%;
            display: flex;
          }
          
          /* Show back button on mobile */
          .msg-back-btn {
            display: block !important;
          }
        }
      `}</style>
      <div className="msg-container">
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        
        {/* Tiêu đề trang */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hộp thư &amp; Tin nhắn trao đổi</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Trao đổi trực tiếp với sinh viên và đồng nghiệp qua kênh tin nhắn nội bộ</p>
        </div>

        {/* 3-Column Message System Layout */}
        <section className={`card msg-layout ${showChatMobile ? "show-chat" : "show-list"}`}>
          
          {/* Left: Chat thread roster */}
          <div className="msg-sidebar-left">
            <div style={{ padding: "15px", borderBottom: "1px solid #EAE0DA", background: "#FFF" }}>
              <div style={{ position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: "14px", top: "11px", color: "#A0A0A0" }} />
                <input 
                  id="chat-search-input"
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm người hoặc cuộc trò chuyện..." 
                  style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: "20px", border: "1px solid #EAE0DA", outline: "none", fontSize: "12.5px", background: "#FFF", color: "#333" }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}>
              {/* If search results exist, show them */}
              {searchTerm.length > 0 && searchResults.length > 0 && (
                <div style={{ background: "#FFF", zIndex: 10, borderBottom: "1px solid #EAE0DA" }}>
                  <div style={{ padding: "8px 15px", fontSize: "11px", fontWeight: "bold", color: "#8B6F5F", background: "#FAFAFA" }}>
                    TÌM THẤY TRONG HỆ THỐNG
                  </div>
                  {searchResults.map((userItem) => (
                    <div 
                      key={userItem.id}
                      onClick={() => handleCreateChat(userItem.id)}
                      style={{ 
                        display: "flex", alignItems: "center", gap: "12px", padding: "15px", 
                        borderBottom: "1px solid #EAE0DA", cursor: "pointer"
                      }}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#E8ECEF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#555" }}>
                        👤
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: "13.5px", color: "#333", fontWeight: "600" }}>{userItem.hoten}</h4>
                        <p style={{ margin: 0, fontSize: "11px", color: "#27AE60" }}>{userItem.role === "SinhVien" ? `Sinh viên` : `Giảng viên`}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "8px 15px", fontSize: "11px", fontWeight: "bold", color: "#8B6F5F", background: "#FAFAFA" }}>
                    CUỘC TRÒ CHUYỆN HIỆN TẠI
                  </div>
                </div>
              )}

              {chatList.filter(chat => chat.name.toLowerCase().includes(searchTerm.toLowerCase())).map((chat) => (
                <div 
                  key={chat.id} 
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setShowChatMobile(true);
                  }}
                  style={{ 
                    display: "flex", alignItems: "center", gap: "12px", padding: "15px", 
                    borderBottom: "1px solid #EAE0DA", cursor: "pointer",
                    background: selectedChatId === chat.id ? "#FFF" : "transparent",
                    transition: "background 0.2s ease"
                  }}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#E8ECEF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#555", flexShrink: 0 }}>
                    {chat.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "13.5px", color: "#333", fontWeight: chat.unread ? "bold" : "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{chat.name}</h4>
                      <span style={{ fontSize: "11px", color: "#999", flexShrink: 0 }}>{chat.time}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontSize: "12px", color: chat.unread ? "#555" : "#888", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontWeight: chat.unread ? "600" : "normal" }}>
                        {chat.lastMsg}
                      </p>
                      {chat.unread > 0 && (
                        <span style={{ background: "#F2A8A8", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "10px", fontWeight: "bold", flexShrink: 0, marginLeft: "8px" }}>
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {chatList.length === 0 ? (
            <div className="msg-main" style={{ alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>📭</div>
              <h3 style={{ color: "#6B4F43", marginBottom: "16px", fontWeight: "bold" }}>Hiện tại chưa có tin nhắn</h3>
              <button 
                onClick={() => {
                  const input = document.getElementById('chat-search-input');
                  if (input) input.focus();
                }}
                style={{ padding: "10px 20px", background: "#F2A8A8", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 4px rgba(242, 168, 168, 0.4)" }}
              >
                Tạo hội thoại mới
              </button>
            </div>
          ) : (
            <>
              {/* Center: Conversation View */}
              <div className="msg-main">
                
                {/* Active Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EAE0DA", padding: "15px 24px", background: "#FFF" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      className="msg-back-btn"
                      onClick={() => setShowChatMobile(false)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#6B4F43",
                        fontSize: "20px",
                        fontWeight: "bold",
                        padding: "4px 8px",
                        marginRight: "4px",
                        display: "none"
                      }}
                      title="Quay lại"
                    >
                      ←
                    </button>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "16px", color: "#333", fontWeight: "700" }}>{selectedChatInfo.name}</h3>
                      <span style={{ fontSize: "12px", color: "#27AE60", fontWeight: "600" }}>{selectedChatInfo.role}</span>
                    </div>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        if (window.confirm("Bạn có chắc muốn xóa lịch sử cuộc trò chuyện này? Nó chỉ xóa ở phía bạn, phía bên kia vẫn giữ nguyên tin nhắn.")) {
                          if (selectedChatId !== null) deleteChatRoom(selectedChatId);
                        }
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#BDBDBD", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseOver={(e) => e.currentTarget.style.color = "#E57373"}
                      onMouseOut={(e) => e.currentTarget.style.color = "#BDBDBD"}
                      title="Xóa cuộc trò chuyện"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Messages Logs scroll */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {messages.length === 0 ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#A0A0A0", fontSize: "13px" }}>
                      Bắt đầu gửi tin nhắn trao đổi...
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div key={index} style={{ alignSelf: msg.isMine ? "flex-end" : "flex-start", display: "flex", gap: "12px", maxWidth: "70%", justifyContent: msg.isMine ? "flex-end" : "flex-start" }}>
                        {!msg.isMine && (
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#E8ECEF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>
                            {selectedChatInfo.avatar}
                          </div>
                        )}
                        <div>
                          {!msg.isMine && <div style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{selectedChatInfo.name}</div>}
                          <div style={{ 
                            background: msg.isMine ? "#FFF4F4" : "#FFF", 
                            padding: "12px 16px", 
                            borderRadius: msg.isMine ? "16px 16px 4px 16px" : "4px 16px 16px 16px", 
                            border: msg.isMine ? "1px solid #F2A8A8" : "1px solid #EAE0DA", 
                            fontSize: "13px", 
                            color: "#333",
                            lineHeight: "1.4",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                            textAlign: msg.isMine ? "right" : "left"
                          }}>
                            {msg.fileUrl ? (
                              (msg.fileName || msg.fileUrl).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.fileUrl} alt="ảnh" style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", display: "block" }} />
                                </a>
                              ) : (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", color: "#333", textDecoration: "none" }}>
                                  <FileText size={18} color="#999" />
                                  <span style={{ fontSize: "12.5px", textDecoration: "underline" }}>{msg.fileName || "Tệp đính kèm"}</span>
                                </a>
                              )
                            ) : null}
                            {msg.content && <div style={{ marginTop: msg.fileUrl ? "8px" : "0" }}>{msg.content}</div>}
                          </div>
                          <div style={{ fontSize: "10px", color: "#999", textAlign: msg.isMine ? "right" : "left", marginTop: "6px" }}>{msg.time}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Typing Prompt input */}
                <div style={{ borderTop: "1px solid #EAE0DA", background: "#FFF", padding: "16px 24px" }}>
                  
                  {/* File Preview */}
                  {pendingFile && (
                    <div style={{ paddingBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ background: "#FDF0F0", border: "1px solid #F2A8A8", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#6B4F43" }}>
                        {pendingFile.file.type.startsWith('image/') ? (
                          <img src={pendingFile.url} alt="preview" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }} />
                        ) : (
                          <FileText size={20} color="#F2A8A8" />
                        )}
                        <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingFile.file.name}</span>
                        <button onClick={() => { setPendingFile(null); setUploadError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B6F5F", padding: "0", display: "flex" }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <div style={{ paddingBottom: "12px", fontSize: "11px", color: "#E57373", display: "flex", alignItems: "center", gap: "6px" }}>
                      <X size={12} />
                      {uploadError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: "none", border: "none", cursor: "pointer", color: pendingFile ? "#F2A8A8" : "#A0A0A0", display: "flex", alignItems: "center", padding: "4px" }}
                      title="Đính kèm tệp"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={pendingFile ? "Thêm tin nhắn kèm... (tùy chọn)" : "Nhập tin nhắn..."} 
                      style={{ flex: 1, padding: "12px 18px", borderRadius: "24px", border: "1px solid #EAE0DA", outline: "none", fontSize: "13.5px", color: "#333", background: "#FAFAFA" }}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isUploading}
                      style={{ width: "42px", height: "42px", borderRadius: "50%", background: isUploading ? "#DDD" : "#F2A8A8", border: "none", color: "white", cursor: isUploading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(242, 168, 168, 0.4)" }}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right: Recipient Inspector metadata sidebar */}
              <div className="msg-sidebar-right">
                <h3 style={{ fontSize: "14px", color: "#333", fontWeight: "700", margin: "0 0 24px 0" }}>Thông tin chi tiết</h3>
                <div style={{ textAlign: "center", paddingBottom: "24px", borderBottom: "1px solid #EAE0DA", marginBottom: "20px" }}>
                  <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#E8ECEF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "32px", color: "#555" }}>
                    {selectedChatInfo.avatar}
                  </div>
                  <h4 style={{ margin: 0, fontSize: "15px", color: "#333", fontWeight: "700" }}>{selectedChatInfo.name}</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#27AE60" }}>{selectedChatInfo.role}</p>
                </div>
                <div style={{ fontSize: "12px", color: "#555", display: "flex", flexDirection: "column", gap: "14px" }}>
                  {selectedChatInfo.email && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontSize: "14px" }}>📧</span> 
                      <div>
                        <b style={{ color: "#333" }}>Email:</b> <br /> 
                        <span style={{ wordBreak: "break-all", color: "#777", marginTop: "2px", display: "inline-block" }}>{selectedChatInfo.email}</span>
                      </div>
                    </div>
                  )}
                  {selectedChatInfo.startDate && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <span style={{ fontSize: "14px" }}>📅</span> 
                      <div>
                        <b style={{ color: "#333" }}>Ngày bắt đầu:</b> <br /> 
                        <span style={{ color: "#777", marginTop: "2px", display: "inline-block" }}>{selectedChatInfo.startDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </section>
      </div>
      </div>
    </DashboardShell>
  );
}