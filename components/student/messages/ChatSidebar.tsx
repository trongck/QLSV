import React from "react";
import { Search } from "lucide-react";
import { ChatRoom } from "@/hooks/sinhvien/useMessages";

interface ChatSidebarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: any[];
  onSelectSearchResult: (mataikhoan: string) => void;
  chatList: ChatRoom[];
  selectedChatId: number | null;
  onSelectChat: (id: number) => void;
  isSearchActive: boolean;
  onFocusSearch: () => void;
  onCloseSearch: () => void;
}

export function ChatSidebar({
  searchTerm,
  onSearchTermChange,
  searchResults,
  onSelectSearchResult,
  chatList,
  selectedChatId,
  onSelectChat,
  isSearchActive,
  onFocusSearch,
  onCloseSearch,
}: ChatSidebarProps) {
  return (
    <div className="msg-sidebar-left">
      <div style={{ padding: "15px", borderBottom: "1px solid #EAE0DA", background: "#FFF" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} style={{ position: "absolute", left: "14px", top: "11px", color: "#A0A0A0" }} />
          <input
            id="chat-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onFocus={onFocusSearch}
            placeholder="Tìm người hoặc cuộc trò chuyện..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              borderRadius: "20px",
              border: "1px solid #EAE0DA",
              outline: "none",
              fontSize: "12.5px",
              background: "#FFF",
              color: "#333",
            }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Search Results / Suggestions */}
        {isSearchActive && (
          <div style={{ background: "#FFF", zIndex: 10, borderBottom: "1px solid #EAE0DA" }}>
            <div style={{ padding: "8px 15px", fontSize: "11px", fontWeight: "bold", color: "#8B6F5F", background: "#FAFAFA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{searchTerm.trim() === "" ? "GỢI Ý LIÊN HỆ" : "TÌM THẤY TRONG HỆ THỐNG"}</span>
              <button 
                onClick={onCloseSearch}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#F2A8A8", 
                  cursor: "pointer", 
                  fontSize: "11px", 
                  fontWeight: "bold",
                  padding: "2px 8px",
                  borderRadius: "4px"
                }}
              >
                Đóng
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div style={{ padding: "20px 15px", textAlign: "center", fontSize: "12.5px", color: "#8B6F5F" }}>
                Không tìm thấy người dùng phù hợp
              </div>
            ) : (
              searchResults.map((userItem) => (
                <div
                  key={userItem.id}
                  onClick={() => onSelectSearchResult(userItem.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "15px",
                    borderBottom: "1px solid #EAE0DA",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#F5EBE6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden"
                    }}
                  >
                    {userItem.anhdaidien ? (
                      <img src={userItem.anhdaidien} alt={userItem.hoten} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <svg className="w-5 h-5 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20" style={{ width: "20px", height: "20px" }}>
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "13.5px", color: "#333", fontWeight: "600" }}>{userItem.hoten}</h4>
                    <p style={{ margin: 0, fontSize: "11px", color: "#27AE60" }}>
                      {userItem.role === "SinhVien" ? "Sinh viên" : "Giảng viên"}
                      {userItem.extra ? ` - ${userItem.extra}` : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
            {chatList.length > 0 && (
              <div style={{ padding: "8px 15px", fontSize: "11px", fontWeight: "bold", color: "#8B6F5F", background: "#FAFAFA" }}>
                CUỘC TRÒ CHUYỆN HIỆN TẠI
              </div>
            )}
          </div>
        )}

        {/* Chat List */}
        {chatList
          .filter((chat) => (chat.name || chat.tieude || "").toLowerCase().includes(searchTerm.toLowerCase()))
          .map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "15px",
                borderBottom: "1px solid #EAE0DA",
                cursor: "pointer",
                background: selectedChatId === chat.id ? "#FFF" : "transparent",
                transition: "background 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "#F5EBE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: "#8B6F5F",
                  flexShrink: 0,
                  overflow: "hidden"
                }}
              >
                {chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg className="w-5 h-5 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20" style={{ width: "20px", height: "20px" }}>
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13.5px",
                      color: "#333",
                      fontWeight: chat.unread ? "bold" : "600",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {chat.name}
                  </h4>
                  <span style={{ fontSize: "11px", color: "#999", flexShrink: 0 }}>{chat.time}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: chat.unread ? "#555" : "#888",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      fontWeight: chat.unread ? "600" : "normal",
                    }}
                  >
                    {typeof chat.lastMsg === "object" && chat.lastMsg !== null
                      ? (chat.lastMsg as any).noidung || "Đã gửi tệp đính kèm"
                      : chat.lastMsg || "Bắt đầu trò chuyện..."}
                  </p>
                  {chat.unread > 0 && (
                    <span
                      style={{
                        background: "#F2A8A8",
                        color: "white",
                        borderRadius: "10px",
                        padding: "2px 6px",
                        fontSize: "10px",
                        fontWeight: "bold",
                        flexShrink: 0,
                        marginLeft: "8px",
                      }}
                    >
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
