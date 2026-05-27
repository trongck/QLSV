"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageCircle, Bot, Trash2, ChevronDown } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
  timestamp: Date;
}

// ─── Markdown Renderer đơn giản ───────────────────────────────────────────────

function renderMarkdown(text: string): string {
  // Escape HTML characters to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  return escaped
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic *text*
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code class="ai-code-inline">$1</code>')
    // Unordered list - item
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/g, "<ul>$1</ul>")
    // Numbered list 1. item
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Headers ### text
    .replace(/^###\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^##\s+(.+)$/gm, "<h3>$1</h3>")
    // Line breaks
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

// ─── Skeleton loading dots ────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="ai-typing-wrap">
      <div className="ai-avatar-sm">
        <Bot size={12} />
      </div>
      <div className="ai-typing-dots">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ChatAIWidget = () => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.hoten?.split(" ").pop() || "bạn";

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      parts: [
        {
          text: `${getGreeting()} **${displayName}**!\n\nMình là **AI hỗ trợ học viên QLSV**. Mình có thể giúp bạn:\n- Xem lịch học & thời khóa biểu\n- Tra cứu điểm số\n- Hướng dẫn điểm danh\n- Hỗ trợ học tập\n\nBạn cần mình giúp gì không?`,
        },
      ],
      timestamp: new Date(),
    },
  ]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setUnreadCount(0);
  };

  const handleClear = () => {
    setMessages([
      {
        role: "model",
        parts: [{ text: `Cuộc trò chuyện đã được làm mới ✨\nMình có thể giúp gì cho **${displayName}** không?` }],
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: "user",
      parts: [{ text: input.trim() }],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          userName: user?.hoten || displayName,
          // Gửi 8 tin nhắn gần nhất để AI nhớ ngữ cảnh
          history: messages.slice(-8).map((m) => ({
            role: m.role,
            parts: m.parts,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Lỗi không xác định");

      const aiMsg: ChatMessage = {
        role: "model",
        parts: [{ text: data.text }],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Nếu widget đóng thì tăng unread
      if (!isOpen || isMinimized) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          parts: [{ text: `❌ **Lỗi:** ${err.message || "Không thể kết nối AI. Vui lòng thử lại sau!"}` }],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, user, displayName, isOpen, isMinimized]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  // ── Nút tròn (khi đóng) ────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <>
        <style>{widgetStyles}</style>
        <button className="ai-fab" onClick={handleOpen} title="Chat với AI hỗ trợ">
          <MessageCircle size={26} />
          {unreadCount > 0 && (
            <span className="ai-badge">{unreadCount}</span>
          )}
        </button>
      </>
    );
  }

  // ── Widget chat ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{widgetStyles}</style>
      <div className={`ai-widget ${isMinimized ? "ai-widget--minimized" : ""}`}>
        {/* Header */}
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-avatar">
              <Bot size={18} />
            </div>
            <div>
              <div className="ai-header-title">AI hỗ trợ học viên</div>
              <div className="ai-header-status">
                <span className="ai-status-dot" />
                {isLoading ? "Đang soạn tin nhắn..." : "Trực tuyến"}
              </div>
            </div>
          </div>
          <div className="ai-header-actions">
            <button className="ai-icon-btn" onClick={handleClear} title="Xóa lịch sử">
              <Trash2 size={15} />
            </button>
            <button
              className="ai-icon-btn"
              onClick={() => setIsMinimized((v) => !v)}
              title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
            >
              <ChevronDown size={16} style={{ transform: isMinimized ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            <button className="ai-icon-btn" onClick={handleClose} title="Đóng">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        {!isMinimized && (
          <>
            <div className="ai-messages" ref={scrollRef}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`ai-msg-row ${msg.role === "user" ? "ai-msg-row--user" : "ai-msg-row--ai"}`}
                >
                  {msg.role === "model" && (
                    <div className="ai-avatar-sm">
                      <Bot size={12} />
                    </div>
                  )}
                  <div className="ai-msg-group">
                    <div
                      className={`ai-bubble ${msg.role === "user" ? "ai-bubble--user" : "ai-bubble--ai"}`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.parts[0].text) }}
                    />
                    <div className="ai-msg-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isLoading && <TypingIndicator />}
            </div>

            {/* Quick suggest */}
            {messages.length === 1 && (
              <div className="ai-suggestions">
                {["Xem lịch học hôm nay", "Kiểm tra điểm số", "Cách điểm danh QR"].map((s) => (
                  <button
                    key={s}
                    className="ai-suggest-btn"
                    onClick={() => {
                      setInput(s);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="ai-input-wrap">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Nhập câu hỏi của bạn..."
                className="ai-input"
                disabled={isLoading}
                maxLength={500}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="ai-send-btn"
              >
                <Send size={17} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const widgetStyles = `
  /* FAB Button */
  .ai-fab {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(192,57,43,0.45);
    z-index: 9999;
    transition: transform 0.2s, box-shadow 0.2s;
    animation: ai-bounce 3s ease-in-out infinite;
  }
  .ai-fab:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 28px rgba(192,57,43,0.6);
  }
  @keyframes ai-bounce {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .ai-fab:hover { animation: none; }

  /* Badge */
  .ai-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #f39c12;
    color: white;
    font-size: 10px;
    font-weight: 700;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Widget container */
  .ai-widget {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 360px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.18);
    border: 1px solid rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    overflow: hidden;
    animation: ai-slidein 0.25s cubic-bezier(0.34,1.56,0.64,1);
    max-height: 560px;
  }
  .ai-widget--minimized {
    max-height: unset;
  }
  @keyframes ai-slidein {
    from { opacity: 0; transform: translateY(24px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Header */
  .ai-header {
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    flex-shrink: 0;
  }
  .ai-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ai-avatar {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }
  .ai-header-title {
    font-weight: 700;
    font-size: 14px;
    line-height: 1.2;
  }
  .ai-header-status {
    font-size: 11px;
    opacity: 0.85;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ai-status-dot {
    width: 7px;
    height: 7px;
    background: #2ecc71;
    border-radius: 50%;
    display: inline-block;
    animation: ai-pulse 2s infinite;
  }
  @keyframes ai-pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .ai-header-actions {
    display: flex;
    gap: 4px;
  }
  .ai-icon-btn {
    background: rgba(255,255,255,0.15);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .ai-icon-btn:hover { background: rgba(255,255,255,0.28); }

  /* Messages area */
  .ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f9fafb;
    min-height: 280px;
    max-height: 320px;
    scroll-behavior: smooth;
  }
  .ai-messages::-webkit-scrollbar { width: 4px; }
  .ai-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

  /* Message rows */
  .ai-msg-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .ai-msg-row--user { flex-direction: row-reverse; }
  .ai-msg-row--ai { flex-direction: row; }

  .ai-avatar-sm {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .ai-msg-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-width: 82%;
  }
  .ai-msg-row--user .ai-msg-group { align-items: flex-end; }
  .ai-msg-row--ai .ai-msg-group { align-items: flex-start; }

  /* Bubbles */
  .ai-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 13.5px;
    line-height: 1.55;
    word-break: break-word;
  }
  .ai-bubble--user {
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    color: white;
    border-bottom-right-radius: 4px;
  }
  .ai-bubble--ai {
    background: white;
    color: #1a1a2e;
    border: 1px solid #ebebeb;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .ai-bubble strong { font-weight: 700; }
  .ai-bubble em { font-style: italic; }
  .ai-bubble ul { margin: 6px 0 6px 16px; padding: 0; }
  .ai-bubble li { margin: 3px 0; }
  .ai-bubble h3 { font-size: 14px; margin: 8px 0 4px; }
  .ai-bubble h4 { font-size: 13px; margin: 6px 0 3px; }
  .ai-code-inline {
    background: rgba(0,0,0,0.08);
    padding: 1px 5px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
  }
  .ai-bubble--user .ai-code-inline { background: rgba(255,255,255,0.2); }

  .ai-msg-time {
    font-size: 10px;
    color: #aaa;
    padding: 0 4px;
  }

  /* Typing indicator */
  .ai-typing-wrap {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }
  .ai-typing-dots {
    background: white;
    border: 1px solid #ebebeb;
    border-radius: 16px;
    border-bottom-left-radius: 4px;
    padding: 10px 14px;
    display: flex;
    gap: 5px;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .ai-typing-dots span {
    width: 7px;
    height: 7px;
    background: #c0392b;
    border-radius: 50%;
    animation: ai-dot 1.2s infinite;
    opacity: 0.4;
  }
  .ai-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
  .ai-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes ai-dot {
    0%,80%,100% { opacity: 0.4; transform: scale(1); }
    40% { opacity: 1; transform: scale(1.3); }
  }

  /* Suggestions */
  .ai-suggestions {
    padding: 8px 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    background: #f9fafb;
    border-top: 1px solid #f0f0f0;
  }
  .ai-suggest-btn {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px;
    color: #c0392b;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }
  .ai-suggest-btn:hover {
    background: #fff0ee;
    border-color: #c0392b;
  }

  /* Input area */
  .ai-input-wrap {
    padding: 12px 14px;
    background: white;
    border-top: 1px solid #f0f0f0;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }
  .ai-input {
    flex: 1;
    border: 1.5px solid #e8e8e8;
    border-radius: 22px;
    padding: 9px 16px;
    font-size: 13.5px;
    outline: none;
    transition: border-color 0.2s;
    background: #fafafa;
    color: #1a1a2e;
  }
  .ai-input:focus { border-color: #e74c3c; background: white; }
  .ai-input:disabled { opacity: 0.6; }
  .ai-input::placeholder { color: #bbb; }

  .ai-send-btn {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #c0392b, #e74c3c);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(192,57,43,0.3);
  }
  .ai-send-btn:hover:not(:disabled) {
    transform: scale(1.08);
    box-shadow: 0 4px 14px rgba(192,57,43,0.45);
  }
  .ai-send-btn:disabled { background: #ccc; box-shadow: none; cursor: not-allowed; }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .ai-widget { width: calc(100vw - 32px); right: 16px; bottom: 16px; }
    .ai-fab { bottom: 16px; right: 16px; }
  }
`;
