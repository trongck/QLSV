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
        if (json && json.success && Array.isArray(json.data)) {
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
        if (json && json.success && Array.isArray(json.data)) {
          setStudentList(json.data);
          if (json.data.length > 0) {
            setSelectedStudent(json.data[0].mssv);
          } else {
            setSelectedStudent(null);
          }
        } else {
          setStudentList([]);
          setSelectedStudent(null);
        }
      } catch (err) {
        console.error("Lỗi tải danh sách học sinh:", err);
        setStudentList([]);
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
      if (json && json.success) {
        if (selectedPC) {
          const resReload = await apiFetch(`/api/giangvien/students?maphancong=${selectedPC}`);
          const jsonReload = await resReload.json();
          if (jsonReload && jsonReload.success && Array.isArray(jsonReload.data)) {
            setStudentList(jsonReload.data);
          }
        }
        alert("Đã cập nhật thông tin sinh viên thành công!");
        setIsEditModalOpen(false);
      } else {
        alert(json?.error || "Không thể cập nhật thông tin sinh viên");
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Lọc an toàn đề phòng s.mssv hoặc s.name bị null từ DB
  const filteredStudents = studentList.filter(s => {
    const mssvMatch = s?.mssv ? s.mssv.includes(searchQuery.trim()) : false;
    const nameMatch = s?.name ? s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) : false;
    return mssvMatch || nameMatch;
  });

  // Tìm sinh viên đang chọn một cách an toàn
  const currentStudent = studentList.find(s => s.mssv === selectedStudent) || studentList[0] || null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Tiêu đề & Thanh công cụ (Bố cục đồng bộ trang xanh) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Hồ sơ &amp; Danh sách sinh viên</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Tra cứu thông tin liên hệ và lý lịch chi tiết của sinh viên lớp giảng dạy</p>
        </div>

        {/* Thanh công cụ tìm kiếm và lọc ngang trải dài */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          gap: "15px",
          background: "#FFF8F5",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid #F0E1D9"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "400px" }}>
            <span style={{ color: "#8B6F5F", fontSize: "14px" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm mã số hoặc tên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flex: 1, 
                padding: "8px 12px", 
                borderRadius: "8px", 
                border: "1px solid #EAD9CB", 
                outline: "none", 
                fontSize: "13px",
                background: "white"
              }}
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B4F43" }}>Lớp học phần:</span>
            <select 
              value={selectedPC ?? ""} 
              onChange={(e) => setSelectedPC(Number(e.target.value))}
              style={{ 
                padding: "8px 16px", 
                borderRadius: "8px", 
                border: "1px solid #EAD9CB", 
                outline: "none", 
                color: "#6B4F43", 
                background: "white",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {classes.map(cls => (
                <option key={cls.maphancong} value={cls.maphancong}>
                  {(cls?.lop?.tenlop || cls?.malop || "")} - {(cls?.monhoc?.tenmon || "")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bố cục hàng dọc trải dài theo chuẩn trang xanh */}
      <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
        
        {/* Khối 1: Bảng danh sách sinh viên Full Width */}
        <section className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #F0E1D9", borderRadius: "12px", background: "white" }}>
          <div style={{ padding: "15px 20px", borderBottom: "1px solid #F0E1D9", background: "#FFFBF9" }}>
            <h3 style={{ margin: 0, fontSize: "15px", color: "#6B4F43", fontWeight: "700" }}>Danh Sách Lớp Học</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0E1D9", background: "#FFFDFD" }}>
                  <th style={{ padding: "14px 20px", fontSize: "13px", color: "#8B6F5F", fontWeight: "600" }}>Mã SV</th>
                  <th style={{ padding: "14px 20px", fontSize: "13px", color: "#8B6F5F", fontWeight: "600" }}>Họ và tên</th>
                  <th style={{ padding: "14px 20px", fontSize: "13px", color: "#8B6F5F", fontWeight: "600" }}>Lớp sinh hoạt</th>
                  <th style={{ padding: "14px 20px", fontSize: "13px", color: "#8B6F5F", fontWeight: "600" }}>Số điện thoại</th>
                  <th style={{ padding: "14px 20px", fontSize: "13px", color: "#8B6F5F", fontWeight: "600", textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
                      Đang tải danh sách sinh viên...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
                      Không tìm thấy sinh viên nào.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((std) => (
                    <tr 
                      key={std?.mssv} 
                      onClick={() => setSelectedStudent(std?.mssv)}
                      style={{ 
                        borderBottom: "1px solid #FDF3EE", 
                        cursor: "pointer",
                        background: selectedStudent === std?.mssv ? "#FFF2F2" : "transparent",
                        transition: "background 0.2s ease"
                      }}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "13.5px", fontWeight: "500" }}>{std?.mssv}</td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#6B4F43" }}>{std?.name}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13.5px", color: "#8B6F5F" }}>{std?.class}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13.5px", color: "#6B4F43" }}>{std?.phone || "---"}</td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <span style={{ 
                          fontSize: "12.5px", 
                          color: selectedStudent === std?.mssv ? "#C25450" : "#8B6F5F", 
                          fontWeight: "bold",
                          border: "1px solid",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: selectedStudent === std?.mssv ? "#FFF" : "#FFFDFD"
                        }}>
                          {selectedStudent === std?.mssv ? "Đang xem" : "Xem chi tiết"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Khối 2: Chi tiết thông tin sinh viên nằm ngang dải đều bên dưới */}
        {currentStudent ? (
          <section className="card" style={{ border: "1px solid #F0E1D9", borderRadius: "12px", background: "white", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F0E1D9", paddingBottom: "15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div style={{ width: "55px", height: "55px", borderRadius: "50%", background: "#F2A8A8", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "22px", fontWeight: "bold" }}>
                  {(currentStudent?.name ? currentStudent.name.charAt(0) : "?")}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#6B4F43", fontWeight: "700" }}>{currentStudent?.name}</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#8B6F5F" }}>Mã số sinh viên: <strong>{currentStudent?.mssv}</strong></p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => handleOpenEdit(currentStudent)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #EAD9CB",
                  background: "#FFF8F5",
                  color: "#6B4F43",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                ✏️ Chỉnh sửa hồ sơ
              </button>
            </div>

            {/* Grid thông tin chia cột gọn gàng giống khối thông tin phụ trang xanh */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#FAF5F2", padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#8B6F5F", fontSize: "13.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thông tin liên lạc</h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                  <span style={{ color: "#8B6F5F" }}>Lớp sinh hoạt:</span> <strong style={{ color: "#6B4F43" }}>{currentStudent?.class}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                  <span style={{ color: "#8B6F5F" }}>Số điện thoại:</span> <strong style={{ color: "#6B4F43" }}>{currentStudent?.phone}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                  <span style={{ color: "#8B6F5F" }}>Địa chỉ Email:</span> <strong style={{ color: "#6B4F43" }}>{currentStudent?.email}</strong>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#FAF5F2", padding: "15px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#8B6F5F", fontSize: "13.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thông tin gia đình & Cư trú</h4>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px" }}>
                  <span style={{ color: "#8B6F5F" }}>Phụ huynh:</span> <strong style={{ color: "#6B4F43" }}>{currentStudent?.parent}</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13.5px" }}>
                  <span style={{ color: "#8B6F5F" }}>Địa chỉ thường trú:</span> <strong style={{ color: "#6B4F43", lineHeight: "1.4" }}>{currentStudent?.address}</strong>
                </div>
              </div>
            </div>

            {/* Vùng gửi thông báo tin nhắn nhanh */}
            <div style={{ borderTop: "1px solid #F0E1D9", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "14px", color: "#6B4F43", fontWeight: "700" }}>Gửi thông báo nhanh tới phụ huynh / sinh viên</h4>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <textarea 
                  placeholder="Nhập lời nhắc học tập, thông báo chuyên cần..."
                  style={{ 
                    flex: 1,
                    padding: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid #F0E1D9", 
                    background: "#FFFDFD", 
                    height: "50px", 
                    resize: "none", 
                    outline: "none", 
                    fontSize: "13px", 
                    color: "#6B4F43" 
                  }}
                />
                <button className={styles.primaryBtn} style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", fontWeight: "600", border: "none", padding: "12px 24px", height: "50px", borderRadius: "8px", color: "white", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Gửi tin nhắn liên lạc
                </button>
              </div>
            </div>
          </section>
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#8B6F5F", background: "white", borderRadius: "12px", border: "1px solid #F0E1D9" }}>
            Hãy chọn một sinh viên để xem chi tiết
          </div>
        )}
      </div>

      {/* Backdrop-blurred Student Edit Modal Overlay */}
      {isEditModalOpen && editingStudent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(45, 27, 20, 0.4)",
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
            maxWidth: "520px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            border: "1px solid #EAD9CB",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #F2A8A8 0%, #FFB4B4 100%)",
              padding: "20px 24px",
              color: "#2D1B14",
              position: "relative"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Chỉnh sửa thông tin Sinh viên</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", opacity: 0.9 }}>Mã số Sinh viên: <strong>{editingStudent?.mssv}</strong></p>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  position: "absolute",
                  top: "22px",
                  right: "24px",
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
            <form onSubmit={handleSaveEdit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>Họ và tên</label>
                  <input 
                    type="text" 
                    value={editingStudent?.name || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, name: e.target.value } : null)}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editingStudent?.phone || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, phone: e.target.value } : null)}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>Địa chỉ Email</label>
                <input 
                  type="email" 
                  value={editingStudent?.email || ""}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, email: e.target.value } : null)}
                  required
                  style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>Họ tên Phụ huynh</label>
                  <input 
                    type="text" 
                    value={editingStudent?.parentName || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentName: e.target.value } : null)}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>SĐT Phụ huynh</label>
                  <input 
                    type="text" 
                    value={editingStudent?.parentPhone || ""}
                    onChange={(e) => setEditingStudent(prev => prev ? { ...prev, parentPhone: e.target.value } : null)}
                    required
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase", textAlign: "left" }}>Nơi cư trú</label>
                <input 
                  type="text" 
                  value={(editingStudent?.rawAddress || editingStudent?.address || "")}
                  onChange={(e) => setEditingStudent(prev => prev ? { ...prev, rawAddress: e.target.value } : null)}
                  required
                  style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "14px", outline: "none", color: "#2D1B14" }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px", borderTop: "1px solid #F5EAE1", paddingTop: "20px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: "10px 18px",
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
                    padding: "10px 22px",
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