"use client";

import { useState } from "react";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function RosterView() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>("22010001");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [studentList, setStudentList] = useState([
    { mssv: "22010001", name: "Nguyễn Văn A", class: "Lập trình Web - K22", phone: "0901234567", email: "nva@gmail.com", parent: "Nguyễn Văn B (Cha) - 0909876543", address: "TP. Hồ Chí Minh" },
    { mssv: "22010002", name: "Trần Thị B", class: "Lập trình Web - K22", phone: "0902345678", email: "ttb@gmail.com", parent: "Lê Thị C (Mẹ) - 0908765432", address: "Hà Nội" },
    { mssv: "22010003", name: "Lê Văn C", class: "Lập trình Web - K22", phone: "0903456789", email: "lvc@gmail.com", parent: "Lê Văn D (Cha) - 0907654321", address: "Đà Nẵng" },
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<typeof studentList[0] | null>(null);

  const handleOpenEdit = (student: typeof studentList[0]) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      setStudentList(prev => prev.map(s => s.mssv === editingStudent.mssv ? editingStudent : s));
      alert("Đã cập nhật thông tin sinh viên thành công! 🎉");
      setIsEditModalOpen(false);
    }
  };

  const filteredStudents = studentList.filter(s => 
    s.mssv.includes(searchQuery) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentStudent = studentList.find(s => s.mssv === selectedStudent) ?? studentList[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hồ sơ &amp; Danh sách sinh viên</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Tra cứu thông tin liên hệ và lý lịch chi tiết của sinh viên lớp giảng dạy</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "20px" }}>
        
        {/* Left Column: Master Table */}
        <section className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #F0E1D9" }}>
          <div style={{ padding: "15px 20px", borderBottom: "1px solid #F0E1D9", display: "flex", gap: "10px" }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm kiếm mã số hoặc tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }}
            />
            <select style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", color: "#6B4F43" }}>
              <option>Lập trình Web - K22</option>
            </select>
          </div>

          <div style={{ padding: "10px 20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0E1D9" }}>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Mã SV</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Họ và tên</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Lớp</th>
                  <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F", textAlign: "right" }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((std) => (
                  <tr 
                    key={std.mssv} 
                    onClick={() => setSelectedStudent(std.mssv)}
                    style={{ 
                      borderBottom: "1px solid #F9F9F9", 
                      cursor: "pointer",
                      background: selectedStudent === std.mssv ? "#FFF4F4" : "transparent"
                    }}
                  >
                    <td style={{ padding: "12px", fontSize: "13px" }}>{std.mssv}</td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#6B4F43" }}>{std.name}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>{std.class}</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <span style={{ fontSize: "16px" }}>👉</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Detailed Card View */}
        <section className="card" style={{ border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", borderBottom: "1px solid #F0E1D9", paddingBottom: "15px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#F2A8A8", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "24px", fontWeight: "bold" }}>
              {currentStudent.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#6B4F43", fontWeight: "bold" }}>{currentStudent.name}</h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8B6F5F" }}>MSSV: {currentStudent.mssv}</p>
            </div>
            <button 
              type="button"
              onClick={() => handleOpenEdit(currentStudent)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #EAD9CB",
                background: "#FFF8F5",
                color: "#6B4F43",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              📝 Sửa
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#6B4F43" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B6F5F" }}>Lớp sinh hoạt:</span> <strong>{currentStudent.class}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B6F5F" }}>Số điện thoại:</span> <strong>{currentStudent.phone}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B6F5F" }}>Địa chỉ Email:</span> <strong>{currentStudent.email}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B6F5F" }}>Liên hệ phụ huynh:</span> <strong style={{ fontSize: "12px" }}>{currentStudent.parent}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8B6F5F" }}>Nơi cư trú:</span> <strong>{currentStudent.address}</strong>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #F0E1D9", paddingTop: "15px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", color: "#8B6F5F", fontWeight: "bold" }}>Nội dung nhắn phụ huynh / sinh viên</h4>
            <textarea 
              placeholder="Nhập lời nhắc, thông báo học vụ để gửi nhanh..."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", background: "#FDF8F5", height: "80px", resize: "none", outline: "none", fontSize: "13px", color: "#6B4F43" }}
            />
            <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", width: "100%", fontWeight: "600" }}>
              ✉️ Gửi tin nhắn liên lạc nhanh
            </button>
          </div>
        </section>

      </div>

      {/* Backdrop-blurred Student Edit Modal Overlay */}
      {isEditModalOpen && editingStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "460px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1px solid #EAD9CB",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #F2A8A8 0%, #FFB4B4 100%)",
              padding: "20px",
              color: "#2D1B14",
              position: "relative"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Chỉnh sửa thông tin Sinh viên</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>Mã số Sinh viên: {editingStudent.mssv}</p>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#2D1B14",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Input: Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Họ và tên</label>
                <input 
                  type="text" 
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Input: Class */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Lớp sinh hoạt</label>
                <input 
                  type="text" 
                  value={editingStudent.class}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, class: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Input: Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Địa chỉ Email</label>
                <input 
                  type="email" 
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Input: Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Số điện thoại</label>
                <input 
                  type="text" 
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Input: Parent */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Liên hệ Phụ huynh</label>
                <input 
                  type="text" 
                  value={editingStudent.parent}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parent: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Input: Address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Nơi cư trú</label>
                <input 
                  type="text" 
                  value={editingStudent.address}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, address: e.target.value } : null)}
                  required
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "14px",
                    outline: "none",
                    color: "#2D1B14"
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", borderTop: "1px solid #F5EAE1", paddingTop: "15px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    background: "white",
                    color: "#6B4F3F",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                    color: "white",
                    fontSize: "13.5px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(242, 168, 168, 0.4)"
                  }}
                >
                  ✓ Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
