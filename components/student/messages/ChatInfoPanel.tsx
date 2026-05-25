import React from "react";

interface ChatInfoPanelProps {
  selectedChatInfo: any;
}

export function ChatInfoPanel({ selectedChatInfo }: ChatInfoPanelProps) {
  const getFormattedDate = (dateStr: string) => {
    try {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr || "";
    }
  };

  return (
    <div className="msg-sidebar-right">
      <h3 style={{ fontSize: "13px", color: "#8B6F5F", fontWeight: "bold", margin: 0 }}>
        Thông tin chi tiết
      </h3>

      <div style={{ textAlign: "center", paddingBottom: "15px", borderBottom: "1px solid #F0E1D9", marginTop: "20px", marginBottom: "15px" }}>
        <div style={{
          width: "60px", height: "60px", borderRadius: "50%", background: "#EAD9CB",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "0 auto 10px auto", fontSize: "24px"
        }}>
          {selectedChatInfo.avatar ? (
            <img src={selectedChatInfo.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg className="w-6 h-6 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20" style={{ width: "24px", height: "24px" }}>
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <h4 style={{ margin: 0, fontSize: "13px", color: "#6B4F43", fontWeight: "bold" }}>
          {selectedChatInfo.name}
        </h4>
        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#8B6F5F" }}>
          {selectedChatInfo.role}
        </p>
      </div>

      <div style={{ fontSize: "11px", color: "#6B4F43", display: "flex", flexDirection: "column", gap: "10px" }}>
        {selectedChatInfo.masv && (
          <div><b>Mã:</b> {selectedChatInfo.masv}</div>
        )}
        {selectedChatInfo.email && (
          <div style={{ wordBreak: "break-all" }}><b>Email:</b> {selectedChatInfo.email}</div>
        )}
        {selectedChatInfo.startDate && (
          <div><b>Ngày bắt đầu:</b> {getFormattedDate(selectedChatInfo.startDate)}</div>
        )}
      </div>
    </div>
  );
}
