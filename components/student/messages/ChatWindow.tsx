import React, { useRef } from "react";
import { Trash2, FileText, X, Paperclip, Send } from "lucide-react";
import { Message } from "@/hooks/sinhvien/useMessages";

interface ChatWindowProps {
  selectedChatId: number | null;
  selectedChatInfo: any;
  messages: Message[];
  onBack: () => void;
  onDeleteChat: (id: number) => void;
  inputText: string;
  onInputTextChange: (text: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  pendingFile: { file: File; url: string } | null;
  onRemovePendingFile: () => void;
  isUploading: boolean;
  uploadError: string | null;
}

export function ChatWindow({
  selectedChatId,
  selectedChatInfo,
  messages,
  onBack,
  onDeleteChat,
  inputText,
  onInputTextChange,
  onSend,
  onFileSelect,
  pendingFile,
  onRemovePendingFile,
  isUploading,
  uploadError,
}: ChatWindowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="msg-main">
      {/* Active Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAE0DA",
          padding: "15px 24px",
          background: "#FFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="msg-back-btn"
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6B4F43",
              fontSize: "20px",
              fontWeight: "bold",
              padding: "4px 8px",
              marginRight: "4px",
              display: "none",
            }}
            title="Quay lại"
          >
            ←
          </button>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "#333", fontWeight: "700" }}>
              {selectedChatInfo.name}
            </h3>
            <span style={{ fontSize: "12px", color: "#27AE60", fontWeight: "600" }}>
              {selectedChatInfo.role}
            </span>
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Bạn có chắc muốn xóa lịch sử cuộc trò chuyện này? Nó chỉ xóa ở phía bạn, phía bên kia vẫn giữ nguyên tin nhắn."
                )
              ) {
                if (selectedChatId !== null) onDeleteChat(selectedChatId);
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#8B6F5F",
              fontSize: "13px",
              fontWeight: "600",
              padding: "4px 8px",
              transition: "color 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#C25450")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#8B6F5F")}
          >
            xoá
          </button>
        </div>
      </div>

      {/* Messages Logs scroll */}
      <div
        style={{
          flex: 1,
          padding: "24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#A0A0A0",
              fontSize: "13px",
            }}
          >
            Bắt đầu gửi tin nhắn trao đổi...
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.isMine ? "flex-end" : "flex-start",
                display: "flex",
                gap: "12px",
                maxWidth: "70%",
                justifyContent: msg.isMine ? "flex-end" : "flex-start",
              }}
            >
              {!msg.isMine && (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#F5EBE6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden"
                  }}
                >
                  {selectedChatInfo.avatar ? (
                    <img src={selectedChatInfo.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <svg className="w-4 h-4 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20" style={{ width: "16px", height: "16px" }}>
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
              <div>
                {!msg.isMine && (
                  <div style={{ fontSize: "11px", color: "#8B6F5F", fontWeight: "600", marginBottom: "4px" }}>
                    {selectedChatInfo.name}
                  </div>
                )}
                <div
                  style={{
                    background: msg.isMine ? "#FFF2EB" : "#FFF",
                    padding: "10px 14px",
                    borderRadius: msg.isMine ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                    border: msg.isMine ? "1px solid #F2A8A8" : "1px solid #EAE0DA",
                    fontSize: "13px",
                    color: "#2D1B14",
                    lineHeight: "1.5",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
                    textAlign: "left",
                  }}
                >
                  {msg.fileUrl ? (
                    (msg.fileName || msg.fileUrl).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={msg.fileUrl}
                          alt="ảnh"
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      </a>
                    ) : (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "#333",
                          textDecoration: "none",
                        }}
                      >
                        <FileText size={18} color="#999" />
                        <span style={{ fontSize: "12.5px", textDecoration: "underline" }}>
                          {msg.fileName || "Tệp đính kèm"}
                        </span>
                      </a>
                    )
                  ) : null}
                  {msg.content && (
                    <div style={{ marginTop: msg.fileUrl ? "8px" : "0" }}>{msg.content}</div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#999",
                    textAlign: msg.isMine ? "right" : "left",
                    marginTop: "6px",
                  }}
                >
                  {msg.time}
                </div>
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
            <div
              style={{
                background: "#FDF0F0",
                border: "1px solid #F2A8A8",
                borderRadius: "8px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#6B4F43",
              }}
            >
              {pendingFile.file.type.startsWith("image/") ? (
                <img
                  src={pendingFile.url}
                  alt="preview"
                  style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px" }}
                />
              ) : (
                <FileText size={20} color="#F2A8A8" />
              )}
              <span
                style={{
                  maxWidth: "150px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {pendingFile.file.name}
              </span>
              <button
                onClick={onRemovePendingFile}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8B6F5F", padding: "0", display: "flex" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div
            style={{
              paddingBottom: "12px",
              fontSize: "11px",
              color: "#E57373",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
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
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: pendingFile ? "#F2A8A8" : "#A0A0A0",
              display: "flex",
              alignItems: "center",
              padding: "4px",
            }}
            title="Đính kèm tệp"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => onInputTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingFile ? "Thêm tin nhắn kèm... (tùy chọn)" : "Nhập tin nhắn..."}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "24px",
              border: "1px solid #EAE0DA",
              outline: "none",
              fontSize: "13.5px",
              color: "#333",
              background: "#FAFAFA",
            }}
          />
          <button
            onClick={onSend}
            disabled={isUploading}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: isUploading ? "#DDD" : "#F2A8A8",
              border: "none",
              color: "white",
              cursor: isUploading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(242, 168, 168, 0.4)",
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
