"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function ExamRoom() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Giao diện giám sát Thi trực tuyến</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Theo dõi sinh viên làm kiểm tra trắc nghiệm kết hợp giám sát AI thông minh</p>
        </div>
        <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px", fontWeight: "600" }}>
          🛑 Kết thúc ca thi
        </button>
      </div>

      {/* Three Column Exam Room Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr", gap: "20px" }}>
        
        {/* Column 1: Test general info & circular question sheet */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "15px", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Thông tin đề kiểm tra</h3>
            <div style={{ marginBottom: "20px", marginTop: "10px" }}>
              <h4 style={{ margin: "0 0 5px 0", color: "#2D1B14", fontWeight: "bold" }}>Giữa kỳ - Lập trình Web</h4>
              <span style={{ fontSize: "12px", background: "#EAFDF5", color: "#178A57", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold" }}>Ca thi đang mở</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#8B6F5F" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>⏱ Thời gian làm bài</span> <strong style={{ color: "#6B4F43" }}>60 phút</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#D65D5D" }}>
                <span>⏳ Thời gian còn lại</span> <strong>35:24</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>📝 Số lượng câu hỏi</span> <strong style={{ color: "#6B4F43" }}>40</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>✅ Tiến độ làm trung bình</span> <strong style={{ color: "#6B4F43" }}>18/40</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Danh sách câu hỏi</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "10px" }}>
              {[...Array(25)].map((_, i) => (
                <div key={i} style={{ 
                  width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px",
                  background: i === 18 ? "#F2A8A8" : i < 18 ? "#E1F5FE" : "#F5F5F5",
                  color: i === 18 ? "white" : i < 18 ? "#039BE5" : "#8B6F5F",
                  border: i === 18 ? "none" : "1px solid #EAD9CB",
                  fontWeight: "600"
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Column 2: Specific question details preview */}
        <section className="card" style={{ padding: "25px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "16px", color: "#2D1B14", fontWeight: "bold", margin: 0 }}>Câu 19: Kết quả in ra màn hình của đoạn code sau là gì?</h3>
          
          <div style={{ background: "#FDF8F5", padding: "15px", borderRadius: "10px", fontFamily: "monospace", border: "1px solid #F0E1D9", fontSize: "13px", color: "#6B4F43" }}>
            <pre style={{ margin: 0 }}>{`function test() {
  let x = 5;
  if (true) {
    let x = 10;
  }
  return x;
}
console.log(test());`}</pre>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {["5", "10", "undefined", "Error"].map((opt, idx) => (
              <label key={idx} style={{ 
                display: "flex", alignItems: "center", gap: "12px", padding: "12px 15px", borderRadius: "8px", border: "1px solid #F0E1D9", cursor: "pointer", fontSize: "13px", color: "#6B4F43"
              }}>
                <input type="radio" name="q19" disabled defaultChecked={idx === 0} />
                <span>{String.fromCharCode(65 + idx)}. {opt}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Column 3: Live AI Proctoring Camera simulation */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Giám sát Live AI (Phát hiện gian lận)</h3>
          
          <div style={{ width: "100%", height: "150px", background: "#D9D9D9", borderRadius: "10px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B6F5F", border: "1px solid #EAD9CB", fontSize: "13px" }}>
             🎥 Mô phỏng Camera Web
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#8B6F5F" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Trạng thái phòng thi</span> <strong style={{ color: "#178A57" }}>An toàn</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Nhận diện khuôn mặt</span> <strong style={{ color: "#178A57" }}>Hợp lệ</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Hướng ánh mắt</span> <strong style={{ color: "#178A57" }}>Đạt yêu cầu</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F0E1D9", paddingTop: "10px" }}>
              <span>Số lần chuyển tab thi</span> <strong style={{ color: "#EB5757" }}>0 lần</strong>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
