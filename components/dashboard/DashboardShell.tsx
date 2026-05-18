"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardSidebar";
import styles from "./DashboardShell.module.css";
import sidebarStyles from "./DashboardLayout.module.css";
import { useAuth } from "@/hook/useAuth";
import { VaiTro } from "@/types";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function DashboardShell({ children, pageTitle }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Close sidebar on route change (any click outside)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sidebar]") && !target.closest("[data-menu-btn]")) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  const showChatWidget = user?.vaitro === VaiTro.GiangVien;

  return (
    <div className={styles.shell}>
      {/* Overlay (tablet/mobile) */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={`${sidebarStyles.sidebar} ${sidebarOpen ? sidebarStyles.open : ""}`}
      >
        <DashboardSidebar />
      </div>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar — tablet & mobile only */}
        <div className={styles.topbarWrap}>
          <DashboardTopbar
            title={pageTitle}
            onMenuClick={() => setSidebarOpen(v => !v)}
          />
        </div>

        {/* Page content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>

      {/* Floating AI Chat Widget for Teacher role */}
      {showChatWidget && <AIChatWidget />}
    </div>
  );
}

function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: "user" | "ai"; text: string; time: string }>>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredSend, setHoveredSend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Khởi tạo tin nhắn chào mừng
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "ai",
          text: `Xin chào thầy/cô **${user?.hoten || "Giảng viên"}**! Tôi là Trợ lý giảng dạy AI 🤖 được tích hợp trực tiếp trên hệ thống.\n\nTôi có thể giúp thầy/cô tra cứu nhanh lịch học, làm báo cáo điểm danh lớp học phần **GT01016-CNTTF** hoặc soạn thảo thông báo nhanh cho sinh viên. Thầy/cô có thể chọn nhanh các câu hỏi gợi ý bên dưới nhé! 👇`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [user, messages.length]);

  // Cuộn tin nhắn tự động
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: Math.random().toString(),
      sender: "user" as const,
      text,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // Giả lập AI phản hồi sau 1.2 giây
    setTimeout(() => {
      setIsTyping(false);
      let replyText = "";
      
      const query = text.toLowerCase();
      if (query.includes("lịch dạy") || query.includes("lich day") || query.includes("hôm nay") || query.includes("hom nay")) {
        replyText = `📅 **Lịch dạy học của thầy/cô hôm nay:**\n\n- **Môn học:** Giáo dục thể chất 1\n- **Lớp học phần:** GT01016-CNTTF (Lớp GDTC1)\n- **Phòng học:** E203 (Khu giảng đường E - VNUA)\n- **Thời gian:** Ca chiều (từ tiết 7 đến tiết 13, bắt đầu lúc 13h00).\n\n*Trợ lý khuyên dùng: Thầy/cô nên kích hoạt mã QR điểm danh trước 5 phút khi lớp bắt đầu học để sinh viên chủ động quét nhé!*`;
      } else if (query.includes("điểm danh") || query.includes("diem danh") || query.includes("thống kê") || query.includes("thong ke")) {
        replyText = `📊 **Tình hình điểm danh lớp GT01016-CNTTF:**\n\n- **Tổng số sinh viên:** 4 sinh viên.\n- **Đã điểm danh:** 4/4 sinh viên (tỉ lệ 100% sĩ số).\n  + Có mặt: 4 sinh viên (Nguyễn Văn Trọng, Bùi Đỗ Quốc Huy, Nguyễn Đức Thắng, Trần Thị Thuỳ Linh).\n  + Đi muộn: 0 sinh viên.\n  + Vắng mặt: 0 sinh viên.\n\n*Ghi chú: Toàn bộ dữ liệu điểm danh đã được ghi nhận tự động vào cơ sở dữ liệu Supabase, phương thức chủ yếu là Quét QR trong lớp học.*`;
      } else if (query.includes("qr") || query.includes("tạo mã") || query.includes("tao ma")) {
        replyText = `💡 **Hướng dẫn tạo mã QR điểm danh nhanh chóng:**\n\n1. Chọn lớp học phần **GT01016-CNTTF** tại thanh công cụ chọn lớp.\n2. Chọn ngày giảng dạy hiện tại (Ví dụ: 18/05/2026).\n3. Chuyển từ tab "Danh sách" sang tab **"QR Code"**.\n4. Nhấp vào nút **"⚡ Tạo Mã QR điểm danh"**.\n\nHệ thống sẽ sinh ra một mã QR bảo mật cố định cho buổi học đó. Sinh viên chỉ cần quét mã bằng thiết bị của mình trong bán kính 300m là điểm danh thành công!`;
      } else if (query.includes("thông báo") || query.includes("thong bao") || query.includes("soạn") || query.includes("soan")) {
        replyText = `📝 **Gợi ý mẫu thông báo nhanh gửi tới sinh viên:**\n\n\`\`\`text\n[THÔNG BÁO] Nhắc nhở ca học ngày 18/05/2026 - Lớp GDTC1\n\nChào toàn thể các em sinh viên lớp GDTC1,\nBuổi học chiều nay sẽ bắt đầu lúc 13h00 tại phòng học E203.\nThầy/cô sẽ mở cổng điểm danh QR từ lúc 13h05. Yêu cầu các em có mặt đúng giờ, mặc đúng trang phục thể dục để thực hành.\nChúc các em có một buổi học tập hiệu quả!\n\`\`\`\n\n*Thầy/cô có thể sao chép mẫu này gửi vào nhóm lớp học phần nhé!*`;
      } else {
        replyText = `Chào thầy/cô **${user?.hoten || "Giảng viên"}**, tôi ghi nhận câu hỏi về: *"${text}"*.\n\nLà Trợ lý Giảng dạy AI, tôi rất vui lòng được đồng hành cùng thầy/cô tại VNUA. Tôi có thể hỗ trợ thầy/cô soạn tài liệu bài giảng, tính toán điểm trung bình của lớp học, hoặc giải thích các thao tác tính năng trên hệ thống quản lý học tập này. Thầy/cô hãy đặt câu hỏi nhé!`;
      }

      const aiMsg = {
        id: Math.random().toString(),
        sender: "ai" as const,
        text: replyText,
        time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1200);
  };

  const quickPrompts = [
    { label: "📅 Lịch dạy hôm nay?", value: "Xem lịch dạy hôm nay" },
    { label: "📊 Thống kê điểm danh?", value: "Thống kê tình hình điểm danh" },
    { label: "💡 Hướng dẫn tạo QR?", value: "Hướng dẫn tạo mã QR điểm danh" },
    { label: "📝 Mẫu thông báo nhanh?", value: "Soạn mẫu thông báo nhanh cho sinh viên" }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FF6B6B 0%, #E05A47 100%)",
          boxShadow: hovered 
            ? "0 12px 32px rgba(224, 90, 71, 0.6)" 
            : "0 8px 24px rgba(224, 90, 71, 0.4)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "26px",
          cursor: "pointer",
          border: "none",
          outline: "none",
          zIndex: 1000,
          transform: hovered ? "scale(1.1) translateY(-2px)" : "scale(1)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s, background 0.3s"
        }}
        title="Trợ lý Giảng dạy AI"
      >
        {isOpen ? "✖" : "💬"}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            width: "380px",
            height: "520px",
            maxHeight: "calc(100vh - 120px)",
            borderRadius: "20px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            boxShadow: "0 12px 40px rgba(107, 79, 67, 0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1000,
            animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            fontFamily: "inherit"
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #6B4F43 0%, #543D33 100%)",
              padding: "16px 20px",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "24px" }}>🤖</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                  Trợ lý Giảng dạy AI
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CD964", display: "inline-block" }}></span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)" }}>Đang trực tuyến</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              onMouseEnter={() => setHoveredClose(true)}
              onMouseLeave={() => setHoveredClose(false)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "#ffffff",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                transform: hoveredClose ? "scale(1.1)" : "scale(1)",
                transition: "transform 0.2s"
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: "16px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(253, 248, 255, 0.4)"
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    background: msg.sender === "user" 
                      ? "#6B4F43" 
                      : "rgba(242, 168, 168, 0.15)",
                    border: msg.sender === "user" 
                      ? "none" 
                      : "1px solid rgba(242, 168, 168, 0.25)",
                    color: msg.sender === "user" ? "#ffffff" : "#4A3329",
                    padding: "10px 14px",
                    borderRadius: msg.sender === "user" 
                      ? "16px 16px 2px 16px" 
                      : "16px 16px 16px 2px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: "10px", color: "#A08A80", marginTop: "4px", padding: "0 4px" }}>
                  {msg.time}
                </span>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div
                  style={{
                    background: "rgba(242, 168, 168, 0.15)",
                    border: "1px solid rgba(242, 168, 168, 0.25)",
                    color: "#6B4F43",
                    padding: "10px 18px",
                    borderRadius: "16px 16px 16px 2px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                  }}
                >
                  <span className="dot" style={{ width: "6px", height: "6px", background: "#6B4F43", borderRadius: "50%", display: "inline-block", animation: "blink 1.4s infinite both" }}></span>
                  <span className="dot" style={{ width: "6px", height: "6px", background: "#6B4F43", borderRadius: "50%", display: "inline-block", animation: "blink 1.4s infinite both 0.2s" }}></span>
                  <span className="dot" style={{ width: "6px", height: "6px", background: "#6B4F43", borderRadius: "50%", display: "inline-block", animation: "blink 1.4s infinite both 0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div
            style={{
              padding: "10px 16px",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
              background: "rgba(255,255,255,0.6)",
              borderTop: "1px solid rgba(107, 79, 67, 0.05)",
              scrollbarWidth: "none"
            }}
          >
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #EAD9CB",
                  background: "#ffffff",
                  color: "#6B4F43",
                  fontSize: "11px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#FF6B6B";
                  e.currentTarget.style.background = "#FFF5F5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#EAD9CB";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            style={{
              padding: "12px 16px",
              display: "flex",
              gap: "8px",
              background: "#ffffff",
              borderTop: "1px solid rgba(107, 79, 67, 0.08)",
              alignItems: "center"
            }}
          >
            <input
              type="text"
              placeholder="Hỏi trợ lý AI..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #EAD9CB",
                outline: "none",
                fontSize: "13px",
                color: "#6B4F43"
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              onMouseEnter={() => setHoveredSend(true)}
              onMouseLeave={() => setHoveredSend(false)}
              style={{
                background: hoveredSend ? "#FF6B6B" : "#6B4F43",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                width: "36px",
                height: "36px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "16px",
                transition: "background 0.2s",
                opacity: (!inputValue.trim() || isTyping) ? 0.5 : 1
              }}
            >
              ✈️
            </button>
          </form>

          {/* CSS Animations */}
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes blink {
              0% { opacity: .2; }
              20% { opacity: 1; }
              100% { opacity: .2; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
