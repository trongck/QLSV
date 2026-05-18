"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import { useRouter } from "next/navigation";

export function HomeworkList() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Quản lý Bài tập Lớp học</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Tạo bài tập, theo dõi thời hạn nộp bài và chấm điểm bài làm sinh viên</p>
        </div>
        <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px" }}>
          ➕ Giao bài tập mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: "16px", display: "flex", gap: "16px", border: "1px solid #F0E1D9" }}>
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm tên bài tập hoặc chủ đề..." 
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }}
        />
        <select style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", color: "#6B4F43", fontSize: "13px" }}>
          <option>Tất cả lớp học phần</option>
          <option>IT01 - Lập trình Web</option>
          <option>IT02 - Cơ sở dữ liệu</option>
        </select>
      </div>

      {/* Assignments Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
        {[
          { id: 1, title: "Báo cáo tiến độ: Luxury Garage", class: "Lập trình Web - Nhóm 11", date: "10/05/2026", done: 17, total: 17, color: "#d32f2f", bg: "#ffebee", label: "Đã đóng" },
          { id: 2, title: "Thiết kế CSDL MySQL", class: "Cơ sở dữ liệu - Nhóm 11", date: "15/05/2026", done: 12, total: 17, color: "#1e8e3e", bg: "#e6f4ea", label: "Đang mở" }
        ].map((item) => (
          <div key={item.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #F0E1D9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#2D1B14", fontWeight: "bold" }}>{item.title}</h3>
              <span style={{ backgroundColor: item.bg, color: item.color, padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>{item.label}</span>
            </div>
            <div style={{ fontSize: "13px", color: "#8B6F5F" }}>
              <p style={{ margin: "4px 0" }}>🏷️ <b>Lớp học:</b> {item.class}</p>
              <p style={{ margin: "4px 0" }}>⏰ <b>Hạn nộp bài:</b> {item.date}</p>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px", color: "#8B6F5F" }}>
                <span>Tiến độ sinh viên nộp bài</span>
                <span style={{ color: "#F2A8A8", fontWeight: "bold" }}>{item.done}/{item.total}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "#F9F9F9", borderRadius: "3px", border: "1px solid #F0E1D9", overflow: "hidden" }}>
                <div style={{ width: `${(item.done / item.total) * 100}%`, height: "100%", backgroundColor: "#F2A8A8" }}></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}>Sửa</button>
              <button style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", fontWeight: "600" }} onClick={() => router.push("/teacher/grades")}>Chấm bài</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
