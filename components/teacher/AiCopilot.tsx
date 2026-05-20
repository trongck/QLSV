"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

interface Message {
  role: "user" | "model";
  text: string;
  time: string;
}

// Simple markdown formatter helper
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 90%; font-weight: bold;">$1</code>')
    .replace(/^[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/g, '<ul style="margin: 6px 0; padding-left: 20px;">$1</ul>')
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    .replace(/^###\s+(.+)$/gm, '<h4 style="margin: 10px 0 5px; color: #6B4F43;">$1</h4>')
    .replace(/^##\s+(.+)$/gm, '<h3 style="margin: 12px 0 6px; color: #6B4F43;">$1</h3>')
    .replace(/\n/g, "<br/>");
}

export function AiCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Xin chào Thầy/Cô! Tôi là Trợ lý Trí tuệ nhân tạo (AI Copilot) hỗ trợ Giảng viên.\n\nTôi có thể giúp Thầy/Cô:\n- 📝 Soạn câu hỏi thi, lập đề kiểm tra ôn tập nhanh chóng.\n- 📊 Phân tích phổ điểm thi, đánh giá chất lượng học tập của lớp học.\n- ⚠️ Cảnh báo sớm các sinh viên có rủi ro học vụ (vắng nhiều, điểm kém).\n- 📖 Tóm tắt giáo trình, tài liệu môn học hoặc đề xuất tài liệu bổ trợ giảng dạy.\n\nHãy chọn một **Tác vụ đề xuất** ở danh sách bên trái hoặc nhập yêu cầu trực tiếp vào khung chat bên dưới!",
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInput("");
    }

    const newMsg: Message = {
      role: "user",
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể kết nối với AI");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.text,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `❌ **Lỗi:** ${err.message || "Đã xảy ra sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau."}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleSuggestClick = (task: string) => {
    let promptText = "";
    switch (task) {
      case "Soạn đề kiểm tra":
        promptText = "Hãy soạn giúp tôi 5 câu hỏi ôn tập trắc nghiệm ngắn về môn Lập trình Web, chủ đề React Components kèm theo đáp án gợi ý.";
        break;
      case "Phân tích phổ điểm":
        promptText = "Hãy hướng dẫn tôi cách phân tích phổ điểm thi và tìm ra phần kiến thức học viên còn yếu nhất từ bảng điểm số.";
        break;
      case "Cảnh báo rớt môn":
        promptText = "Làm sao để lọc danh sách sinh viên có nguy cơ rớt môn dựa trên số tiết vắng điểm danh và điểm thành phần dưới trung bình?";
        break;
      case "Tóm tắt giáo trình":
        promptText = "Tóm tắt giúp tôi những chương cốt lõi nhất của môn học Lập trình Web và gợi ý lộ trình học tập 15 tuần.";
        break;
      case "Gợi ý tài liệu tham khảo":
        promptText = "Gợi ý cho tôi một số tài liệu tham khảo uy tín, giáo trình chuẩn quốc tế hoặc khóa học bổ trợ cho sinh viên ngành Công nghệ thông tin.";
        break;
      default:
        promptText = `Hỗ trợ tôi tác vụ: ${task}`;
    }
    handleSend(promptText);
  };

  const handleClear = () => {
    if (window.confirm("Thầy/Cô có muốn xóa toàn bộ lịch sử hội thoại hiện tại không?")) {
      setMessages([
        {
          role: "model",
          text: "Cuộc hội thoại đã được làm mới. Hãy nhập yêu cầu mới của Thầy/Cô!",
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Trợ lý Giảng viên Trí tuệ nhân tạo (AI Copilot)</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Tự động soạn đề ôn tập, phân tích kết quả học tập và phát hiện cảnh báo rủi ro học vụ</p>
        </div>
        <button
          onClick={handleClear}
          style={{
            padding: "8px 16px",
            background: "#FDF8F5",
            border: "1px solid #EAD9CB",
            borderRadius: "8px",
            color: "#8B6F5F",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F4E5DB")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FDF8F5")}
        >
          🗑️ Làm mới hội thoại
        </button>
      </div>

      <section className="card" style={{ display: "flex", padding: "0", height: "550px", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        
        {/* Left suggestion panel */}
        <div style={{ width: "220px", borderRight: "1px solid #F0E1D9", padding: "20px", background: "#FDF8F5", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <h3 style={{ fontSize: "14px", color: "#8B6F5F", marginBottom: "15px", fontWeight: "bold", margin: 0 }}>Tác vụ đề xuất</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            {[
              { label: "Soạn đề kiểm tra", icon: "📝" },
              { label: "Phân tích phổ điểm", icon: "📊" },
              { label: "Cảnh báo rớt môn", icon: "⚠️" },
              { label: "Tóm tắt giáo trình", icon: "📖" },
              { label: "Gợi ý tài liệu tham khảo", icon: "💡" },
            ].map((item, i) => (
              <button 
                key={i} 
                onClick={() => handleSuggestClick(item.label)}
                disabled={isLoading}
                style={{ 
                  display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", 
                  borderRadius: "8px", border: "1px solid #EAD9CB", background: "white",
                  fontSize: "12px", cursor: "pointer", textAlign: "left", color: "#6B4F43", fontWeight: "600",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#FFF2EB"; }}
                onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = "white"; }}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main chat viewport */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
          
          <div style={{ flex: 1, padding: "10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }} ref={scrollRef}>
            {messages.map((msg, index) => (
              <div 
                key={index}
                style={{ 
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start", 
                  maxWidth: msg.role === "user" ? "50%" : "60%", 
                  display: "flex", 
                  gap: "10px" 
                }}
              >
                {msg.role === "model" && (
                  <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#9B51E0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "18px" }}>
                    ✨
                  </div>
                )}
                <div>
                  <div 
                    style={{ 
                      background: msg.role === "user" ? "#FDF8F5" : "#F9F9F9", 
                      padding: msg.role === "user" ? "12px 18px" : "15px", 
                      borderRadius: msg.role === "user" ? "15px 15px 0 15px" : "0 15px 15px 15px", 
                      border: msg.role === "user" ? "1px solid #F0E1D9" : "1px solid #EEE", 
                      fontSize: "13.5px", 
                      lineHeight: "1.6",
                      color: "#6B4F43" 
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                  />
                  <div style={{ textAlign: msg.role === "user" ? "right" : "left", fontSize: "10px", color: "#8B6F5F", marginTop: "5px" }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ alignSelf: "flex-start", display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#9B51E0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "18px" }}>
                  ✨
                </div>
                <div style={{ fontSize: "13px", color: "#8B6F5F", fontStyle: "italic" }}>
                  AI đang suy nghĩ và soạn thảo câu trả lời...
                </div>
              </div>
            )}
          </div>

          {/* Prompt Chat bar */}
          <div style={{ padding: "15px", borderTop: "1px solid #F0E1D9" }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ position: "relative", display: "flex", alignItems: "center" }}
            >
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Nhập yêu cầu soạn giáo án, tạo đề kiểm tra hoặc phân tích kết quả..." 
                style={{ 
                  width: "80%", padding: "15px 50px 15px 20px", borderRadius: "30px", 
                  border: "1px solid #EAD9CB", outline: "none", background: "#FDF8F5", fontSize: "13px", color: "#6B4F43"
                }} 
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{ 
                  position: "absolute", right: "5px", width: "40px", height: "42px", 
                  borderRadius: "50%", border: "none", background: (isLoading || !input.trim()) ? "#EAD9CB" : "#F2A8A8", color: "white", 
                  cursor: (isLoading || !input.trim()) ? "not-allowed" : "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                🚀
              </button>
            </form>
          </div>

        </div>

      </section>
    </div>
  );
}
