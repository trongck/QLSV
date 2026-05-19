"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function ChatbotAI() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Trợ lý Giảng viên Trí tuệ nhân tạo (AI Copilot)</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Tự động soạn đề ôn tập, phân tích kết quả học tập và phát hiện cảnh báo rủi ro học vụ</p>
        </div>
      </div>

      <section className="card" style={{ display: "flex", padding: "0", height: "550px", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        
        {/* Left suggestion panel */}
        <div style={{ width: "220px", borderRight: "1px solid #F0E1D9", padding: "20px", background: "#FDF8F5" }}>
          <h3 style={{ fontSize: "14px", color: "#8B6F5F", marginBottom: "15px", fontWeight: "bold", margin: 0 }}>Tác vụ đề xuất</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
            {[
              { label: "Soạn đề kiểm tra", icon: "📝" },
              { label: "Phân tích phổ điểm", icon: "📊" },
              { label: "Cảnh báo rớt môn", icon: "⚠️" },
              { label: "Tóm tắt giáo trình", icon: "📖" },
              { label: "Gợi ý tài liệu tham khảo", icon: "💡" },
            ].map((item, i) => (
              <button key={i} style={{ 
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", 
                borderRadius: "8px", border: "1px solid #EAD9CB", background: "white",
                fontSize: "12px", cursor: "pointer", textAlign: "left", color: "#6B4F43", fontWeight: "600",
                transition: "all 0.2s"
              }}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main chat viewport */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
          
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* User query */}
            <div style={{ alignSelf: "flex-end", maxWidth: "70%" }}>
              <div style={{ background: "#FDF8F5", padding: "12px 18px", borderRadius: "15px 15px 0 15px", border: "1px solid #F0E1D9", fontSize: "13px", color: "#6B4F43" }}>
                Phân tích phổ điểm thi giữa kỳ lớp Web IT01 giúp tôi với.
              </div>
              <div style={{ textAlign: "right", fontSize: "10px", color: "#8B6F5F", marginTop: "5px" }}>10:30</div>
            </div>

            {/* AI Response */}
            <div style={{ alignSelf: "flex-start", maxWidth: "80%", display: "flex", gap: "12px" }}>
              <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#9B51E0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "18px" }}>
                ✨
              </div>
              <div>
                <div style={{ background: "#F9F9F9", padding: "15px", borderRadius: "0 15px 15px 15px", border: "1px solid #EEE", fontSize: "13px", lineHeight: "1.6", color: "#6B4F43" }}>
                  <p style={{ margin: "0 0 10px 0" }}>Dưới đây là kết quả phân tích sơ bộ phổ điểm thi của lớp <b>IT01 - Lập trình Web</b>:</p>
                  <ul style={{ margin: 0, paddingLeft: "20px" }}>
                    <li>Điểm trung bình toàn lớp: <b>8.15</b> (Khá - Tốt)</li>
                    <li>Tỷ lệ sinh viên đạt học phần: <b>96.2%</b></li>
                    <li>Số lượng sinh viên cần chú ý hỗ trợ: <strong style={{ color: "#EB5757" }}>5 bạn</strong> (Điểm dưới 5.0)</li>
                    <li>Phần lý thuyết yếu nhất: <b>Cơ sở dữ liệu &amp; Thiết kế CSDL</b></li>
                  </ul>
                  <p style={{ margin: "10px 0 0 0", fontStyle: "italic", color: "#8B6F5F" }}>Bạn có muốn AI tự động soạn thảo 10 câu hỏi ôn tập tập trung vào phần CSDL để củng cố kiến thức cho lớp không?</p>
                </div>
                <div style={{ fontSize: "10px", color: "#8B6F5F", marginTop: "5px" }}>10:31</div>
              </div>
            </div>

            {/* AI Notification Alert Card */}
            <div style={{ alignSelf: "flex-start", maxWidth: "80%", display: "flex", gap: "12px" }}>
              <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#9B51E0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, fontSize: "18px" }}>
                ✨
              </div>
              <div style={{ background: "#FFF4F4", padding: "12px 18px", borderRadius: "0 15px 15px 15px", border: "1px solid #F2A8A8", fontSize: "13px", color: "#6B4F43" }}>
                🚨 <b>Cảnh báo học vụ:</b> Hệ thống AI phát hiện 3 tài khoản sinh viên đăng nhập cùng địa chỉ IP và có thời điểm click nộp bài thi trùng khớp cực cao trong kỳ thi giữa kỳ vừa qua.
              </div>
            </div>

          </div>

          {/* Prompt Chat bar */}
          <div style={{ padding: "20px", borderTop: "1px solid #F0E1D9" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input 
                type="text" 
                placeholder="Nhập yêu cầu soạn giáo án, tạo quiz hoặc phân tích kết quả..." 
                style={{ 
                  width: "100%", padding: "15px 60px 15px 20px", borderRadius: "30px", 
                  border: "1px solid #EAD9CB", outline: "none", background: "#FDF8F5", fontSize: "13px", color: "#6B4F43"
                }} 
              />
              <button style={{ 
                position: "absolute", right: "5px", width: "42px", height: "42px", 
                borderRadius: "50%", border: "none", background: "#F2A8A8", color: "white", 
                cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                🚀
              </button>
            </div>
          </div>

        </div>

      </section>
    </div>
  );
}
