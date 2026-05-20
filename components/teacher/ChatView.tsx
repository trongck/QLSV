"use client";

import { useState, useEffect, useRef } from "react";
import * as repo from "@/services/repositories/teacher-messages.repo";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function ChatView() {
  const [conversations, setConversations] = useState<repo.ConversationRow[]>([]);
  const [activeConv, setActiveConv] = useState<repo.ConversationRow | null>(null);
  const [messages, setMessages] = useState<repo.MessageRow[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<repo.UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Message compose state
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Loadings
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Self identity
  const [myMataikhoan, setMyMataikhoan] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const loadConversations = async (silent = false) => {
    if (!silent) setLoadingConvs(true);
    try {
      const data = await repo.getConversations();
      setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  // Mount logic
  useEffect(() => {
    loadConversations();

    // Setup poll for conversations & messages list
    const interval = setInterval(() => {
      loadConversations(true);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Poll active conversation messages
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    const loadMsgs = async (silent = false) => {
      if (!silent) setLoadingMsgs(true);
      try {
        const res = await repo.getMessages(activeConv.macuoctrochuyen);
        setMessages(res.data);
        if (res.me?.mataikhoan) {
          setMyMataikhoan(res.me.mataikhoan);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        if (!silent) setLoadingMsgs(false);
      }
    };

    loadMsgs();

    const interval = setInterval(() => {
      loadMsgs(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConv]);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle outside clicks to close search results dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await repo.searchUsers(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Start/open 1-1 chat
  const handleSelectUser = async (user: repo.UserSearchResult) => {
    setShowSearchResults(false);
    setSearchQuery("");
    try {
      const res = await repo.createOrGetConversation(user.mataikhoan);
      await loadConversations();
      
      // Select the conversation
      const found = conversations.find(c => c.macuoctrochuyen === res.data.macuoctrochuyen);
      if (found) {
        setActiveConv(found);
      } else {
        // Fallback: reload and search the list
        const updated = await repo.getConversations();
        setConversations(updated);
        const match = updated.find(c => c.macuoctrochuyen === res.data.macuoctrochuyen);
        if (match) setActiveConv(match);
      }
    } catch (err) {
      alert("Không thể bắt đầu cuộc trò chuyện");
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!activeConv || (!inputText.trim() && !sending)) return;
    setSending(true);
    try {
      const text = inputText.trim();
      setInputText("");
      const newMsg = await repo.sendMessage(activeConv.macuoctrochuyen, text);
      setMessages(prev => [...prev, newMsg]);
      // Reload list to update last messages
      loadConversations(true);
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Gửi tin nhắn thất bại");
    } finally {
      setSending(false);
    }
  };

  // Upload attachment
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeConv || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const uploadRes = await repo.uploadAttachment(file);
      // Send message with publicUrl as attachment
      const newMsg = await repo.sendMessage(
        activeConv.macuoctrochuyen,
        `📎 [Đính kèm] ${uploadRes.name}`,
        uploadRes.url
      );
      setMessages(prev => [...prev, newMsg]);
      loadConversations(true);
    } catch (err: any) {
      alert(err.message || "Tải lên tệp đính kèm thất bại");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: number) => {
    if (!confirm("Bạn có chắc chắn muốn ẩn tin nhắn này phía bạn không?")) return;
    try {
      await repo.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.matinnhan !== msgId));
    } catch (err) {
      alert("Xóa tin nhắn thất bại");
    }
  };

  // Delete/hide conversation
  const handleDeleteConversation = async () => {
    if (!activeConv) return;
    if (!confirm(`Bạn có muốn ẩn cuộc hội thoại với ${getRecipientName(activeConv)}?`)) return;
    try {
      await repo.deleteConversation(activeConv.macuoctrochuyen);
      setActiveConv(null);
      loadConversations();
    } catch (err) {
      alert("Không thể xóa cuộc trò chuyện");
    }
  };

  // Helper formats
  const getRecipientName = (conv: repo.ConversationRow) => {
    if (conv.tieude) return conv.tieude;
    if (conv.otherMembers && conv.otherMembers.length > 0) {
      return conv.otherMembers[0].taikhoan?.hoten || "Người dùng";
    }
    return "Trò chuyện";
  };

  const getRecipientProfile = (conv: repo.ConversationRow) => {
    if (conv.otherMembers && conv.otherMembers.length > 0) {
      return conv.otherMembers[0].taikhoan;
    }
    return null;
  };

  const parseDate = (isoString: string) => {
    if (!isoString) return new Date();
    let normalized = isoString.trim();
    if (normalized.includes(" ")) {
      normalized = normalized.replace(" ", "T");
    }
    if (!normalized.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
      normalized += "Z";
    }
    return new Date(normalized);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = parseDate(isoString);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatLastMsgTime = (isoString: string) => {
    try {
      const d = parseDate(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hộp thư &amp; Tin nhắn trao đổi</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Trao đổi trực tiếp với sinh viên và đồng nghiệp qua kênh tin nhắn nội bộ</p>
        </div>
      </div>

      <section className="card" style={{ display: "flex", padding: "0", height: "580px", overflow: "hidden", border: "1px solid #F0E1D9", background: "#FFF" }}>
        
        {/* Left: Conversations roster */}
        <div style={{ width: "300px", borderRight: "1px solid #F0E1D9", display: "flex", flexDirection: "column", background: "#FDF8F5" }}>
          
          {/* Search bar */}
          <div ref={searchContainerRef} style={{ padding: "15px", borderBottom: "1px solid #F0E1D9", position: "relative" }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm người hoặc cuộc trò chuyện..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "12px", background: "#FFF" }}
            />
            {searching && (
              <span style={{ position: "absolute", right: "25px", top: "23px", fontSize: "11px", color: "#8B6F5F" }}>Đang tìm...</span>
            )}
            
            {/* Search results dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "50px", left: "15px", right: "15px",
                background: "#FFF", border: "1px solid #F0E1D9", borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: "250px", overflowY: "auto"
              }}>
                {searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => handleSelectUser(user)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px",
                      borderBottom: "1px solid #FDF8F5", cursor: "pointer", fontSize: "12.5px"
                    }}
                    className={styles.searchItemHover}
                  >
                    <div style={{
                      width: "30px", height: "30px", borderRadius: "50%", background: "#EAD9CB",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "13px"
                    }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ margin: 0, fontWeight: "600", color: "#6B4F43" }}>{user.hoten}</h5>
                      <p style={{ margin: 0, fontSize: "10px", color: "#8B6F5F" }}>
                        {user.role === "SinhVien" ? "Sinh viên" : "Giảng viên"} {user.extra ? `• ${user.extra}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {loadingConvs ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#8B6F5F", fontSize: "12.5px" }}>Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#8B6F5F", fontSize: "12.5px" }}>Không có cuộc hội thoại nào</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConv?.macuoctrochuyen === conv.macuoctrochuyen;
                const recProfile = getRecipientProfile(conv);
                const recipientName = getRecipientName(conv);

                return (
                  <div 
                    key={conv.macuoctrochuyen} 
                    onClick={() => setActiveConv(conv)}
                    style={{ 
                      display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                      borderBottom: "1px solid #F0E1D9", cursor: "pointer",
                      background: isSelected ? "#FFF" : "transparent"
                    }}
                  >
                    <div style={{
                      width: "35px", height: "35px", borderRadius: "50%", background: "#EAD9CB",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "15px", flexShrink: 0
                    }}>
                      {recProfile?.anhdaidien ? (
                        <img src={recProfile.anhdaidien} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h4 style={{ margin: 0, fontSize: "12.5px", color: "#6B4F43", fontWeight: conv.unread > 0 ? "bold" : "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {recipientName}
                        </h4>
                        <span style={{ fontSize: "10px", color: "#8B6F5F" }}>
                          {conv.lastMsg ? formatLastMsgTime(conv.lastMsg.ngaytao) : formatLastMsgTime(conv.ngaytao)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                        <p style={{ margin: 0, fontSize: "11px", color: conv.unread > 0 ? "#6B4F43" : "#8B6F5F", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontWeight: conv.unread > 0 ? "600" : "normal", flex: 1 }}>
                          {conv.lastMsg ? conv.lastMsg.noidung : "Chưa có tin nhắn"}
                        </p>
                        {conv.unread > 0 && (
                          <span style={{
                            background: "#F2A8A8", color: "#FFF", fontSize: "9px", fontWeight: "bold",
                            padding: "2px 6px", borderRadius: "10px", marginLeft: "5px"
                          }}>
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center: Message Conversation View */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FFF" }}>
          {activeConv ? (
            <>
              {/* Header */}
              <div style={{ padding: "15px 20px", borderBottom: "1px solid #F0E1D9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "14.5px", color: "#6B4F43", fontWeight: "bold" }}>
                    {getRecipientName(activeConv)}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "10.5px", color: "#27AE60" }}>
                    {getRecipientProfile(activeConv)?.vaitro === "SinhVien" ? "Sinh viên" : "Đồng nghiệp"}
                  </p>
                </div>
                <button 
                  onClick={handleDeleteConversation}
                  title="Ẩn hội thoại"
                  style={{ background: "none", border: "none", fontSize: "15px", cursor: "pointer", color: "#8B6F5F", padding: "5px" }}
                >
                  🗑️
                </button>
              </div>

              {/* Message scroll list */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px", background: "#FAF6F3" }}>
                {loadingMsgs && messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#8B6F5F", fontSize: "12px", marginTop: "10px" }}>Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#8B6F5F", fontSize: "12px", marginTop: "20px" }}>Bắt đầu gửi tin nhắn trao đổi...</div>
                ) : (
                  messages.map((msg) => {
                    const isSelf = msg.mataikhoangui === myMataikhoan;
                    
                    return (
                      <div 
                        key={msg.matinnhan}
                        style={{ 
                          alignSelf: isSelf ? "flex-end" : "flex-start", 
                          display: "flex", gap: "10px", maxWidth: "70%",
                          flexDirection: isSelf ? "row-reverse" : "row"
                        }}
                      >
                        {/* Avatar */}
                        {!isSelf && (
                          <div style={{
                            width: "30px", height: "30px", borderRadius: "50%", background: "#EAD9CB",
                            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "13px", flexShrink: 0
                          }}>
                            {getRecipientProfile(activeConv)?.anhdaidien ? (
                              <img src={getRecipientProfile(activeConv)!.anhdaidien!} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              "👤"
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", alignItems: isSelf ? "flex-end" : "flex-start" }}>
                          {/* Name header for other users */}
                          {!isSelf && (
                            <span style={{ fontSize: "10.5px", color: "#8B6F5F", marginBottom: "2px" }}>
                              {getRecipientName(activeConv)}
                            </span>
                          )}
                          
                          {/* Message box */}
                          <div 
                            style={{ 
                              background: isSelf ? "#FFF4F4" : "#FFF", 
                              padding: "10px 14px", 
                              borderRadius: isSelf ? "12px 12px 0 12px" : "0 12px 12px 12px", 
                              border: isSelf ? "1px solid #F2A8A8" : "1px solid #EAD9CB", 
                              fontSize: "12.5px", 
                              color: "#6B4F43",
                              position: "relative",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                              wordBreak: "break-word"
                            }}
                            className={styles.messageBoxHover}
                          >
                            {msg.filedinh ? (
                              <a href={msg.filedinh} target="_blank" rel="noopener noreferrer" style={{ color: "#E05A47", fontWeight: "600", textDecoration: "underline", display: "flex", alignItems: "center", gap: "5px" }}>
                                📁 {msg.noidung || "Tải xuống tệp"}
                              </a>
                            ) : (
                              msg.noidung
                            )}

                            {/* Delete single message trigger */}
                            <button 
                              onClick={() => handleDeleteMessage(msg.matinnhan)}
                              title="Ẩn tin nhắn này"
                              style={{
                                position: "absolute", right: isSelf ? "auto" : "-20px", left: isSelf ? "-20px" : "auto",
                                top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", color: "#C0392B", fontSize: "10px",
                                cursor: "pointer", display: "none"
                              }}
                              className="delete-msg-btn"
                            >
                              ❌
                            </button>
                          </div>

                          {/* Time label */}
                          <span style={{ fontSize: "9px", color: "#8B6F5F", marginTop: "3px" }}>
                            {formatMessageTime(msg.ngaytao)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Compose bar */}
              <div style={{ padding: "15px 20px", borderTop: "1px solid #F0E1D9", display: "flex", gap: "10px", alignItems: "center", background: "#FFF" }}>
                
                {/* File Attachment */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadAttachment}
                  style={{ display: "none" }} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Đính kèm tệp"
                  style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#8B6F5F" }}
                >
                  {uploading ? "⏳" : "📎"}
                </button>

                {/* Text input */}
                <input 
                  type="text" 
                  placeholder="Nhập tin nhắn..." 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  style={{ flex: 1, padding: "12px 15px", borderRadius: "20px", border: "1px solid #EAD9CB", outline: "none", fontSize: "13px", color: "#6B4F43", background: "#FDF8F5" }}
                />

                {/* Send */}
                <button 
                  onClick={handleSendMessage}
                  disabled={sending || (!inputText.trim() && !sending)}
                  style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F2A8A8", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ➔
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF6F3", color: "#8B6F5F" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>💬</div>
              <h4 style={{ margin: 0, fontWeight: "600" }}>Hộp thoại chưa được chọn</h4>
              <p style={{ margin: "5px 0 0 0", fontSize: "12px" }}>Chọn một cuộc hội thoại bên trái hoặc tìm kiếm sinh viên để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>

        {/* Right: Recipient metadata inspector */}
        {activeConv && getRecipientProfile(activeConv) && (
          <div style={{ width: "220px", borderLeft: "1px solid #F0E1D9", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", background: "#FDF8F5" }}>
            <h3 style={{ fontSize: "13px", color: "#8B6F5F", fontWeight: "bold", margin: 0 }}>Thông tin chi tiết</h3>
            
            <div style={{ textAlign: "center", paddingBottom: "15px", borderBottom: "1px solid #F0E1D9" }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "50%", background: "#EAD9CB",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "0 auto 10px auto", fontSize: "24px"
              }}>
                {getRecipientProfile(activeConv)?.anhdaidien ? (
                  <img src={getRecipientProfile(activeConv)!.anhdaidien!} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  "👤"
                )}
              </div>
              <h4 style={{ margin: 0, fontSize: "13px", color: "#6B4F43", fontWeight: "bold" }}>
                {getRecipientName(activeConv)}
              </h4>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#8B6F5F" }}>
                {getRecipientProfile(activeConv)?.vaitro === "SinhVien" ? "Sinh viên" : "Giảng viên"}
              </p>
            </div>

            <div style={{ fontSize: "11px", color: "#6B4F43", display: "flex", flexDirection: "column", gap: "10px" }}>
              {getRecipientProfile(activeConv)?.id_phu && (
                <div>🆔 <b>Mã:</b> {getRecipientProfile(activeConv)!.id_phu}</div>
              )}
              {getRecipientProfile(activeConv)?.email && (
                <div style={{ wordBreak: "break-all" }}>📧 <b>Email:</b> {getRecipientProfile(activeConv)!.email}</div>
              )}
              <div>📅 <b>Ngày bắt đầu:</b> {formatDate(activeConv.ngaytao)}</div>
            </div>
          </div>
        )}

      </section>

      {/* Global CSS to handle message deletion button display on hover */}
      <style jsx global>{`
        .delete-msg-btn {
          opacity: 0;
          transition: opacity 0.2s ease-in-out;
        }
        div:hover > .delete-msg-btn {
          opacity: 1 !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
}

function formatDate(isoString: string) {
  try {
    if (!isoString) return "";
    let normalized = isoString.trim();
    if (normalized.includes(" ")) {
      normalized = normalized.replace(" ", "T");
    }
    if (!normalized.includes("Z") && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
      normalized += "Z";
    }
    const d = new Date(normalized);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
}
