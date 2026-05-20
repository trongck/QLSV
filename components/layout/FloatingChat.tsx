"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageFilled,
  CloseOutlined,
  SendOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { apiFetch } from "@/services/service/auth/auth.service";

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

// Simple markdown formatter helper
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>')
    .replace(/\n/g, "<br/>");
}

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Chào Thầy/Cô! Tôi là Trợ lý AI hỗ trợ giảng dạy. Thầy/Cô có câu hỏi nào về quy chế đào tạo, lập đề thi hoặc phân tích kết quả học tập không?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new message arrives or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const textToSend = input.trim();
    if (!textToSend || isLoading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: textToSend,
          history: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể kết nối máy chủ AI");

      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `❌ **Lỗi:** ${err.message || "Lỗi kết nối. Vui lòng thử lại sau!"}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* 1. KHUNG CHAT TO & TỐI GIẢN */}
      <div
        style={{
          width: isOpen ? "450px" : "0px", // Chiều rộng khi mở là 450px
          height: isOpen ? "650px" : "0px", // Chiều cao khi mở là 650px
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? "visible" : "hidden",
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)", // Hiệu ứng bung ra mượt mà
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#C25450",
            color: "white",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <RobotOutlined style={{ fontSize: "24px" }} />
            <span style={{ fontWeight: "bold", fontSize: "18px" }}>
              Trợ lý AI Giảng viên
            </span>
          </div>
          <CloseOutlined
            onClick={() => setIsOpen(false)}
            style={{ cursor: "pointer", fontSize: "20px", padding: "5px" }}
          />
        </div>

        {/* Nội dung tin nhắn */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            padding: "20px",
            overflowY: "auto",
            backgroundColor: "#fdfdfd",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  backgroundColor: msg.role === "user" ? "#FFF2EB" : "#f0f0f0",
                  border: msg.role === "user" ? "1px solid #EAD9CB" : "1px solid #eee",
                  padding: "12px 16px",
                  borderRadius: msg.role === "user" ? "15px 15px 0px 15px" : "15px 15px 15px 0px",
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: "#333",
                }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
              />
            </div>
          ))}

          {isLoading && (
            <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <div
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "12px 16px",
                  borderRadius: "15px 15px 15px 0px",
                  fontSize: "14px",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                AI đang suy nghĩ...
              </div>
            </div>
          )}
        </div>

        {/* Ô nhập tin nhắn */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: "20px",
            borderTop: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập nội dung câu hỏi..."
            style={{
              flex: 1,
              border: "1px solid #ddd",
              borderRadius: "25px",
              padding: "12px 20px",
              outline: "none",
              fontSize: "15px",
              transition: "border 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#C25450")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              backgroundColor: (isLoading || !input.trim()) ? "#ccc" : "#C25450",
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: (isLoading || !input.trim()) ? "not-allowed" : "pointer",
              border: "none",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && input.trim()) {
                e.currentTarget.style.transform = "scale(1.1)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <SendOutlined style={{ color: "white", fontSize: "18px" }} />
          </button>
        </form>
      </div>

      {/* 2. NÚT TRÒN & BONG BÓNG CHÀO */}
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        {/* Bong bóng chào (Chỉ hiện khi đang đóng) */}
        {!isOpen && (
          <div
            style={{
              backgroundColor: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              position: "relative",
              fontWeight: "500",
              fontSize: "15px",
              color: "#333",
              whiteSpace: "nowrap",
              animation: "fadeInLeft 0.5s ease",
            }}
          >
            Bấm vào đây để chat với AI
            <div
              style={{
                position: "absolute",
                right: "-8px",
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "8px solid transparent",
                borderBottom: "8px solid transparent",
                borderLeft: "8px solid white",
              }}
            />
          </div>
        )}

        {/* Nút tròn */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            backgroundColor: "#C25450",
            borderRadius: "50%",
            width: "65px",
            height: "65px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 6px 20px rgba(194,84,80,0.3)",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.05)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isOpen ? (
            <CloseOutlined style={{ color: "white", fontSize: "26px" }} />
          ) : (
            <MessageFilled style={{ color: "white", fontSize: "30px" }} />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingChat;
