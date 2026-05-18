"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function ChatView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hộp thư &amp; Tin nhắn trao đổi</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Trao đổi trực tiếp với sinh viên và phụ huynh qua kênh tin nhắn nội bộ</p>
        </div>
      </div>

      {/* 3-Column Message System Layout */}
      <section className="card" style={{ display: "flex", padding: "0", height: "550px", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        
        {/* Left: Chat thread roster */}
        <div style={{ width: "250px", borderRight: "1px solid #F0E1D9", display: "flex", flexDirection: "column", background: "#FDF8F5" }}>
          <div style={{ padding: "15px", borderBottom: "1px solid #F0E1D9" }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm cuộc hội thoại..." 
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "12px" }}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {[
              { id: 1, name: "Lớp Lập trình Web - K22", lastMsg: "Chào cô, hạn nộp bài tập lớn...", unread: true, time: "10:05", avatar: "👥" },
              { id: 2, name: "Nguyễn Văn A (Sinh viên)", lastMsg: "Cô xem giúp em bài báo cáo...", unread: false, time: "Hôm qua", avatar: "👤" },
              { id: 3, name: "Phụ huynh Trần Thị B", lastMsg: "Cảm ơn cô đã thông báo tình hình...", unread: false, time: "15/05", avatar: "👤" },
            ].map((thread) => (
              <div 
                key={thread.id} 
                style={{ 
                  display: "flex", alignItems: "center", gap: "10px", padding: "12px 15px", 
                  borderBottom: "1px solid #F0E1D9", cursor: "pointer",
                  background: thread.id === 1 ? "#FFF" : "transparent"
                }}
              >
                <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#EAD9CB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
                  {thread.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h4 style={{ margin: 0, fontSize: "12.5px", color: "#6B4F43", fontWeight: thread.unread ? "bold" : "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{thread.name}</h4>
                    <span style={{ fontSize: "10px", color: "#8B6F5F" }}>{thread.time}</span>
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: thread.unread ? "#6B4F43" : "#8B6F5F", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontWeight: thread.unread ? "bold" : "normal" }}>
                    {thread.lastMsg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Conversation View */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FFF" }}>
          
          {/* Active Header */}
          <div style={{ padding: "15px 20px", borderBottom: "1px solid #F0E1D9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "15px", color: "#6B4F43", fontWeight: "bold" }}>Lớp Lập trình Web - K22</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#27AE60" }}>● Đang trực tuyến</p>
            </div>
            <button style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>⚙️</button>
          </div>

          {/* Messages Logs scroll */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
            
            {/* Incoming message */}
            <div style={{ alignSelf: "flex-start", display: "flex", gap: "10px", maxWidth: "70%" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#EAD9CB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>👥</div>
              <div>
                <span style={{ fontSize: "11px", color: "#8B6F5F" }}>Nguyễn Văn A</span>
                <div style={{ background: "#F5F5F5", padding: "10px 14px", borderRadius: "0 12px 12px 12px", border: "1px solid #EEE", fontSize: "12.5px", color: "#6B4F43", marginTop: "4px" }}>
                  Dạ cô ơi, hạn nộp bài tập lớn Luxury Garage vào lúc mấy giờ tối nay ạ?
                </div>
              </div>
            </div>

            {/* Outgoing message */}
            <div style={{ alignSelf: "flex-end", display: "flex", gap: "10px", maxWidth: "70%", justifyContent: "flex-end" }}>
              <div>
                <div style={{ background: "#FFF4F4", padding: "10px 14px", borderRadius: "12px 12px 0 12px", border: "1px solid #F2A8A8", fontSize: "12.5px", color: "#6B4F43", textAlign: "right" }}>
                  Chào em, hạn nộp là trước 23:59 đêm nay em nhé. Hệ thống sẽ khóa sau giờ này.
                </div>
              </div>
            </div>

          </div>

          {/* Typing Prompt input */}
          <div style={{ padding: "15px 20px", borderTop: "1px solid #F0E1D9", display: "flex", gap: "10px", alignItems: "center" }}>
            <button style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#8B6F5F" }}>📎</button>
            <input 
              type="text" 
              placeholder="Nhập tin nhắn..." 
              style={{ flex: 1, padding: "12px 15px", borderRadius: "20px", border: "1px solid #EAD9CB", outline: "none", fontSize: "13px", color: "#6B4F43", background: "#FDF8F5" }}
            />
            <button style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F2A8A8", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ➔
            </button>
          </div>

        </div>

        {/* Right: Recipient Inspector metadata sidebar */}
        <div style={{ width: "200px", borderLeft: "1px solid #F0E1D9", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", background: "#FDF8F5" }}>
          <h3 style={{ fontSize: "13px", color: "#8B6F5F", fontWeight: "bold", margin: 0 }}>Thông tin cuộc trò chuyện</h3>
          <div style={{ textAlign: "center", paddingBottom: "15px", borderBottom: "1px solid #F0E1D9" }}>
            <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#F2A8A8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px auto", color: "white", fontSize: "22px", fontWeight: "bold" }}>L</div>
            <h4 style={{ margin: 0, fontSize: "13.5px", color: "#6B4F43", fontWeight: "bold" }}>Lập trình Web - K22</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#8B6F5F" }}>Mã nhóm: IT01</p>
          </div>
          <div style={{ fontSize: "11px", color: "#6B4F43", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>👥 <b>Thành viên:</b> 42 sinh viên</div>
            <div>📅 <b>Ngày tạo:</b> 01/01/2026</div>
            <div>📂 <b>Tệp đã chia sẻ:</b> 12 tệp đính kèm</div>
          </div>
        </div>

      </section>
    </div>
  );
}
