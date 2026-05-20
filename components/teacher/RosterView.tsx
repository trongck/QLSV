"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

interface RosterStudent {
  mssv: string;
  name: string;
  class: string;
  phone: string;
  email: string;
  parent: string;
  parentName: string;
  parentPhone: string;
  address: string;
  rawAddress: string;
}

export function RosterView() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [studentList, setStudentList] = useState<RosterStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<RosterStudent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Tải danh sách lớp phân công
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiFetch("/api/giangvien/students");
        const json = await res.json();
        if (json.success && json.data) {
          setClasses(json.data);
          if (json.data.length > 0) {
            setSelectedPC(json.data[0].maphancong);
          }
        }
      } catch (err) {
        console.error("Lỗi tải lớp học phần:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClasses();
  }, []);

  // Tải danh sách học sinh của lớp được chọn
  useEffect(() => {
    if (!selectedPC) return;
    async function loadStudents() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/giangvien/students?maphancong=${selectedPC}`);
        const json = await res.json();
        if (json.success && json.data) {
          setStudentList(json.data);
          if (json.data.length > 0) {
            setSelectedStudent(json.data[0].mssv);
          } else {
            setSelectedStudent(null);
          }
        }
      } catch (err) {
        console.error("Lỗi tải danh sách học sinh:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [selectedPC]);

  const handleOpenEdit = (student: RosterStudent) => {
    setEditingStudent({ ...student });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSaving(true);
    try {
      const res = await apiFetch("/api/giangvien/students", {
        method: "PUT",
        body: JSON.stringify({
          masv: editingStudent.mssv,
          name: editingStudent.name,
          email: editingStudent.email,
          phone: editingStudent.phone,
          parentName: editingStudent.parentName,
          parentPhone: editingStudent.parentPhone,
          address: editingStudent.rawAddress || editingStudent.address
        })
      });

      const json = await res.json();
      if (json.success) {
        // Tải lại danh sách học sinh để cập nhật hiển thị chính xác
        if (selectedPC) {
          const resReload = await apiFetch(`/api/giangvien/students?maphancong=${selectedPC}`);
          const jsonReload = await resReload.json();
          if (jsonReload.success && jsonReload.data) {
            setStudentList(jsonReload.data);
          }
        }
        alert("Đã cập nhật thông tin sinh viên thành công!");
        setIsEditModalOpen(false);
      } else {
        alert(json.error || "Không thể cập nhật thông tin sinh viên");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = studentList.filter(s => 
    s.mssv.includes(searchQuery.trim()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
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
              placeholder="Tìm kiếm mã số hoặc tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }}
            />
            <select 
              value={selectedPC ?? ""} 
              onChange={(e) => setSelectedPC(Number(e.target.value))}
              style={{ padding: "8px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", color: "#6B4F43", background: "white" }}
            >
              {classes.map(cls => (
                <option key={cls.maphancong} value={cls.maphancong}>
                  {cls.lop?.tenlop ?? cls.malop} - {cls.monhoc?.tenmon}
                </option>
              ))}
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
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#8B6F5F" }}>
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "30px", textAlign: "center", color: "#8B6F5F" }}>
                      Không tìm thấy sinh viên nào.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
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
                        <span style={{ fontSize: "12px", color: "#C25450", fontWeight: "bold" }}>Xem</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Detailed Card View */}
        <section className="card" style={{ border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          {currentStudent ? (
            <>
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
                  Sửa
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
                <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", width: "100%", fontWeight: "600", border: "none" }}>
                  Gửi tin nhắn liên lạc nhanh
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8B6F5F" }}>
              Hãy chọn một sinh viên để xem chi tiết
            </div>
          )}
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

              {/* Input: Parent Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>Họ tên Phụ huynh</label>
                <input 
                  type="text" 
                  value={editingStudent.parentName}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentName: e.target.value } : null)}
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

              {/* Input: Parent Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F", textTransform: "uppercase", textAlign: "left" }}>SĐT Phụ huynh</label>
                <input 
                  type="text" 
                  value={editingStudent.parentPhone}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentPhone: e.target.value } : null)}
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
                  value={editingStudent.rawAddress || editingStudent.address}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, rawAddress: e.target.value } : null)}
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
                  disabled={isSaving}
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
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
