"use client";
import React, { useState } from "react";
import {
  MessageFilled,
  CloseOutlined,
  SendOutlined,
  RobotOutlined,
} from "@ant-design/icons";

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);

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
            backgroundColor: "#ff0000",
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
              Trợ lý AI Học viện
            </span>
          </div>
          <CloseOutlined
            onClick={() => setIsOpen(false)}
            style={{ cursor: "pointer", fontSize: "20px", padding: "5px" }}
          />
        </div>

        {/* Nội dung tin nhắn */}
        <div
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
          {/* Tin nhắn từ AI */}
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div
              style={{
                backgroundColor: "#f0f0f0",
                padding: "12px 16px",
                borderRadius: "15px 15px 15px 0px",
                fontSize: "15px",
                lineHeight: "1.5",
                color: "#333",
              }}
            >
              Chào bạn! Tôi có thể hỗ trợ gì cho bạn về các môn học IT hay quản
              lý sinh viên không?
            </div>
          </div>
        </div>

        {/* Ô nhập tin nhắn */}
        <div
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
            onFocus={(e) => (e.target.style.borderColor = "#ff0000")}
            onBlur={(e) => (e.target.style.borderColor = "#ddd")}
          />
          <div
            style={{
              backgroundColor: "#ff0000",
              width: "45px",
              height: "45px",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.1)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <SendOutlined style={{ color: "white", fontSize: "18px" }} />
          </div>
        </div>
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

        {/* Nút tròn đỏ */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            backgroundColor: "#ff0000",
            borderRadius: "50%",
            width: "65px",
            height: "65px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 6px 20px rgba(255,0,0,0.3)",
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
