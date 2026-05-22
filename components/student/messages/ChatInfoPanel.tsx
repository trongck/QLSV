import React from "react";

interface ChatInfoPanelProps {
  selectedChatInfo: any;
}

export function ChatInfoPanel({ selectedChatInfo }: ChatInfoPanelProps) {
  return (
    <div className="msg-sidebar-right">
      <h3 style={{ fontSize: "14px", color: "#333", fontWeight: "700", margin: "0 0 24px 0" }}>
        Thông tin chi tiết
      </h3>
      <div
        style={{
          textAlign: "center",
          paddingBottom: "24px",
          borderBottom: "1px solid #EAE0DA",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "#E8ECEF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            fontSize: "32px",
            color: "#555",
          }}
        >
          {selectedChatInfo.avatar}
        </div>
        <h4 style={{ margin: 0, fontSize: "15px", color: "#333", fontWeight: "700" }}>
          {selectedChatInfo.name}
        </h4>
        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#27AE60" }}>
          {selectedChatInfo.role}
        </p>
      </div>
      <div style={{ fontSize: "12px", color: "#555", display: "flex", flexDirection: "column", gap: "14px" }}>
        {selectedChatInfo.email && (
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "14px" }}>📧</span>
            <div>
              <b style={{ color: "#333" }}>Email:</b> <br />
              <span
                style={{
                  wordBreak: "break-all",
                  color: "#777",
                  marginTop: "2px",
                  display: "inline-block",
                }}
              >
                {selectedChatInfo.email}
              </span>
            </div>
          </div>
        )}
        {selectedChatInfo.startDate && (
          <div style={{ display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "14px" }}>📅</span>
            <div>
              <b style={{ color: "#333" }}>Ngày bắt đầu:</b> <br />
              <span style={{ color: "#777", marginTop: "2px", display: "inline-block" }}>
                {selectedChatInfo.startDate}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
