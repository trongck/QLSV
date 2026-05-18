"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function ReportView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Phân tích &amp; Thống kê kết quả học tập</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Nhận thông tin trực quan về kết quả và tình hình tham gia của sinh viên</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #F2A8A8", background: "#FFF", color: "#F2A8A8", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
            👁️ Xem báo cáo cũ
          </button>
          <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px", fontWeight: "600" }}>
            ✨ Tạo báo cáo mới
          </button>
        </div>
      </div>

      {/* Filter Box */}
      <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px" }}>
          {[
            { label: "Khoa", options: ["CNTT", "Kinh tế", "Cơ khí"] },
            { label: "Năm học", options: ["2025-2026", "2024-2025"] },
            { label: "Học kỳ", options: ["Kỳ 2", "Kỳ 1", "Kỳ hè"] },
            { label: "Lớp học", options: ["Lập trình Web", "Cơ sở dữ liệu"] },
            { label: "Môn học", options: ["Tất cả học phần", "Thực hành"] }
          ].map((filter, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>{filter.label}</label>
              <select style={{ padding: "8px", borderRadius: "6px", border: "1px solid #F0E1D9", color: "#6B4F43", outline: "none", fontSize: "13px" }}>
                {filter.options.map((opt, i) => <option key={i}>{opt}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* KPI statistics cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {[
          { title: "Tỷ lệ điểm danh trung bình", value: "92.5%", sub: "+5% so với tháng trước", color: "#6FCF97" },
          { title: "Tỷ lệ đạt học phần (>=5.0)", value: "96.2%", sub: "+3% so với khóa trước", color: "#6FCF97" },
          { title: "Điểm tích lũy trung bình", value: "8.15", sub: "+0.45 so với giữa kỳ", color: "#6FCF97" }
        ].map((card, i) => (
          <div key={i} className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <div style={{ color: "#8B6F5F", fontSize: "13px" }}>{card.title}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: "#2D1B14", margin: "8px 0" }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: card.color, fontWeight: "600" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts & Comments */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1.2fr", gap: "20px" }}>
        
        {/* Pie chart (Donut) */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Phân bổ điểm số</h3>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "10px 0" }}>
            <div style={{ position: "relative", width: "130px", height: "130px", borderRadius: "50%", background: "conic-gradient(#6FCF97 0% 45%, #F2C94C 45% 75%, #EB5757 75% 85%, #2D9CDB 85% 100%)" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "70px", height: "70px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", color: "#6B4F43" }}>HK2</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#6FCF97" }}></div> Điểm A (45%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#F2C94C" }}></div> Điểm B (30%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#EB5757" }}></div> Điểm C (10%)</div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}><div style={{ width: "8px", height: "8px", background: "#2D9CDB" }}></div> Điểm D/F (15%)</div>
          </div>
        </section>

        {/* Bar chart (Attendance trend) */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Xu hướng điểm danh hàng tuần</h3>
          <div style={{ height: "150px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderLeft: "1px solid #F0E1D9", borderBottom: "1px solid #F0E1D9", padding: "0 10px 5px 5px" }}>
            {[40, 70, 55, 90, 65, 85, 75, 95].map((h, i) => (
              <div key={i} style={{ width: "14px", height: `${h}%`, background: "#F2A8A8", borderRadius: "4px 4px 0 0", position: "relative" }}>
                <span style={{ position: "absolute", bottom: "-20px", left: "-5px", fontSize: "9px", color: "#8B6F5F", whiteSpace: "nowrap" }}>T.{i+1}</span>
              </div>
            ))}
          </div>
          <div style={{ height: "10px" }} />
        </section>

        {/* Notes block */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: "0 0 10px 0" }}>📝 Nhận xét giảng viên</h3>
          <textarea 
            placeholder="Ghi chú nhận xét chung về lớp học phần..."
            style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #F0E1D9", background: "#FDF8F5", fontSize: "13px", resize: "none", outline: "none", color: "#6B4F43" }}
          />
          <button style={{ marginTop: "10px", width: "100%", background: "#6B4F43", color: "white", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
            Lưu nhận xét
          </button>
        </section>

      </div>

      {/* Export action */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
        <button style={{ display: "flex", alignItems: "center", gap: "8px", background: "#178A57", color: "white", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>
          📥 Tải xuống báo cáo học phần (.xlsx)
        </button>
      </div>
    </div>
  );
}
