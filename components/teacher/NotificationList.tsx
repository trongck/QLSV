"use client";

import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function NotificationList() {
  const notifications = [
    { 
      id: 1, icon: "🔔", title: "Thông báo nghỉ lễ 30/4 - 1/5", sender: "Hệ thống", 
      type: "Quan trọng", typeBg: "#FFF0F0", typeColor: "#EB5757", isUnread: true 
    },
    { 
      id: 2, icon: "🤖", title: "AI phát hiện bất thường trong kỳ thi", sender: "Hệ thống AI", 
      type: "Cảnh báo", typeBg: "#FFF8F0", typeColor: "#F2994A", isUnread: true 
    },
    { 
      id: 3, icon: "📝", title: "Lớp Web có bài tập mới", sender: "GV. Linh Hạnh", 
      type: "Thông báo", typeBg: "#F0F5FF", typeColor: "#2D9CDB", isUnread: false 
    },
    { 
      id: 4, icon: "📊", title: "Kết quả thi giữa kỳ đã được công bố", sender: "Phòng đào tạo", 
      type: "Thông báo", typeBg: "#F0F5FF", typeColor: "#2D9CDB", isUnread: false 
    },
    { 
      id: 5, icon: "🛠️", title: "Bảo trì hệ thống ngày 20/05", sender: "Hệ thống IT", 
      type: "Thông báo", typeBg: "#F0F5FF", typeColor: "#2D9CDB", isUnread: false 
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Thông báo hệ thống &amp; lớp học</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Cập nhật tin tức quan trọng từ Nhà trường và các hoạt động giảng dạy</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8B6F5F", cursor: "pointer" }}>
            <input type="checkbox" style={{ accentColor: "#F2A8A8" }} /> Đánh dấu đã đọc tất cả
          </label>
          <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px" }}>
            ➕ Tạo thông báo mới
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="card" style={{ padding: "15px", display: "flex", gap: "15px", alignItems: "center", border: "1px solid #F0E1D9" }}>
        <select style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", width: "200px", color: "#6B4F43" }}>
          <option>Tất cả thông báo</option>
          <option>Quan trọng</option>
          <option>Cảnh báo AI</option>
          <option>Lớp học</option>
        </select>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm nội dung thông báo..." 
            style={{ width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }} 
          />
        </div>
      </div>

      {/* NOTIFICATION LIST VIEWPORT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.map((note) => (
          <div 
            key={note.id} 
            className="card" 
            style={{ 
              padding: "15px 20px", 
              display: "flex", 
              alignItems: "center", 
              gap: "20px", 
              border: "1px solid #F0E1D9",
              background: note.isUnread ? "#FFF9F9" : "#FFF",
              transition: "all 0.2s"
            }}
          >
            <div style={{ 
              width: "45px", height: "45px", borderRadius: "50%", background: note.isUnread ? "#FFEAEA" : "#F5F5F5",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
            }}>
              {note.icon}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: "15px", color: "#6B4F43", fontWeight: note.isUnread ? "700" : "500" }}>
                {note.title}
              </h4>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#8B6F5F" }}>{note.sender}</p>
            </div>

            <span style={{ 
              padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600",
              background: note.typeBg, color: note.typeColor 
            }}>
              {note.type}
            </span>

            <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
              <button style={{ background: "none", border: "none", color: "#BDBDBD", cursor: "pointer" }} title="Đánh dấu đã đọc">✔️</button>
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#EB5757" }} title="Xóa thông báo">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
