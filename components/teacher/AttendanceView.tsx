"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import { FaceAttendanceModal } from "./FaceAttendanceModal";

type SubTab = "list" | "qrcode" | "leave_requests";

interface LopItem {
  maphancong: number;
  malophoc: string;
  tenmon: string;
  mamon: string;
  tenlop: string;
}

interface BuoiHocItem {
  mabuoihoc: number;
  malichhoc: number;
  maphancong?: number;
  ngayhoc: string;
  trangthai: string;
  qr_secret?: string;
}

interface LeaveRequestItem {
  id: number;
  mssv: string;
  name: string;
  class: string;
  dateRequested: string;
  reason: string;
  dateSubmitted: string;
  evidence: string;
  status: string;
}

interface StudentAttendance {
  mssv: string;
  name: string;
  status: string;
  type: string;
  time: string;
  note: string;
  face_embedding?: number[] | null;
}

export function AttendanceView() {
  const [subTab, setSubTab] = useState<SubTab>("list");
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<LopItem[]>([]);
  const [allSessions, setAllSessions] = useState<BuoiHocItem[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  
  // Selection States
  const [selectedPC, setSelectedPC] = useState<number | null>(null);
  const [selectedBH, setSelectedBH] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState("");

  // Roster Student Checklist
  const [roster, setRoster] = useState<StudentAttendance[]>([]);

  // Fetch overview data (classes, sessions, leave requests)
  const fetchOverview = async (selectFirst = false) => {
    try {
      const res = await apiFetch("/api/giangvien/attendance");
      const json = await res.json();
      if (json.success) {
        setClasses(json.data.dsLop || []);
        setAllSessions(json.data.buoiHocList || []);
        setLeaveRequests(json.data.dsDonXinNghi || []);

        if (selectFirst && json.data.dsLop?.length > 0) {
          const firstPC = json.data.dsLop[0].maphancong;
          setSelectedPC(firstPC);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin điểm danh:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(true);
  }, []);

  // Filter sessions matching selected class (maphancong)
  const classSessions = allSessions.filter((s) => {
    return s.maphancong === selectedPC;
  });

  // Khi thay đổi lớp hoặc buổi học được chọn
  useEffect(() => {
    if (selectedBH && selectedPC) {
      apiFetch(`/api/giangvien/attendance?mabuoihoc=${selectedBH}&maphancong=${selectedPC}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) {
            setRoster(json.data);
          }
        })
        .catch((e) => console.error("Lỗi tải danh sách điểm danh:", e));
    } else {
      setRoster([]);
    }
  }, [selectedBH, selectedPC]);

  // Tự động tìm buổi học trùng với ngày được chọn khi đổi lớp hoặc đổi ngày
  useEffect(() => {
    if (!selectedPC) return;
    const match = allSessions.find((s) => s.ngayhoc === selectedDate && s.maphancong === selectedPC);
    if (match) {
      setSelectedBH(match.mabuoihoc);
    } else {
      setSelectedBH(null);
    }
  }, [selectedPC, selectedDate, allSessions]);

  // Làm mới mã QR động
  const handleRefreshQR = async () => {
    if (!selectedBH) return;
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateQR",
          mabuoihoc: selectedBH,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const newSecret = json.data.qr_secret;
        setAllSessions(prev => prev.map(s => s.mabuoihoc === selectedBH ? { ...s, qr_secret: newSecret } : s));
      }
    } catch (e) {
      console.error("Lỗi làm mới mã QR:", e);
    }
  };



  // Tạo buổi điểm danh mới cho ngày được chọn
  const handleCreateSession = async () => {
    if (!selectedPC) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSession",
          maphancong: selectedPC,
          date: selectedDate,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchOverview(false);
        setSelectedBH(json.data.mabuoihoc);
      } else {
        alert(json.error || "Không thể tạo buổi học");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái điểm danh của sinh viên trực tiếp
  const handleStatusChange = async (mssv: string, newStatus: string) => {
    if (!selectedBH) return;
    try {
      const current = roster.find(r => r.mssv === mssv);
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAttendance",
          mabuoihoc: selectedBH,
          masv: mssv,
          status: newStatus,
          ghichu: current?.note || "-"
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Cập nhật local state cực mượt
        setRoster(prev => prev.map(item => {
          if (item.mssv === mssv) {
            const type = newStatus === "Có mặt" ? "green" : newStatus === "Đi muộn" ? "orange" : newStatus === "Vắng có phép" ? "orange" : "red";
            return {
              ...item,
              status: newStatus,
              type,
              time: newStatus === "Có mặt" || newStatus === "Đi muộn" ? new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--"
            };
          }
          return item;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sửa ghi chú điểm danh
  const handleNoteChange = async (mssv: string, newNote: string) => {
    if (!selectedBH) return;
    try {
      const current = roster.find(r => r.mssv === mssv);
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAttendance",
          mabuoihoc: selectedBH,
          masv: mssv,
          status: current?.status || "Vắng",
          ghichu: newNote
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRoster(prev => prev.map(item => item.mssv === mssv ? { ...item, note: newNote } : item));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Duyệt đơn xin nghỉ
  const handleApproveLeave = async (madon: number, mssv: string) => {
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLeave",
          madon,
          status: "Đã duyệt"
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLeaveRequests(prev => prev.map(req => req.id === madon ? { ...req, status: "Đã duyệt" } : req));
        // Nếu đang mở đúng ca điểm danh đó thì đồng bộ trạng thái hiển thị
        setRoster(prev => prev.map(std => std.mssv === mssv ? { ...std, status: "Vắng có phép", type: "orange", note: "Vắng có phép (Đơn xin nghỉ)" } : std));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Từ chối đơn xin nghỉ
  const handleRejectLeave = async (madon: number) => {
    try {
      const res = await apiFetch("/api/giangvien/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateLeave",
          madon,
          status: "Từ chối"
        }),
      });
      const json = await res.json();
      if (json.success) {
        setLeaveRequests(prev => prev.map(req => req.id === madon ? { ...req, status: "Từ chối" } : req));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRoster = roster.filter(r => 
    r.mssv.includes(searchQuery) || r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
        Đang tải dữ liệu điểm danh...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Quản lý Điểm danh lớp học</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Ghi nhận trạng thái tham gia lớp học phần và duyệt phép vắng học</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => fetchOverview(false)}
            style={{ padding: "10px 15px", borderRadius: "10px", border: "1px solid #EAD9CB", background: "#FFF", color: "#6B4F43", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
          >
            🔄 Làm mới
          </button>
          {!selectedBH && selectedPC && (
            <button 
              onClick={handleCreateSession}
              className={styles.primaryBtn} 
              style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px" }}
            >
              ➕ Tạo ca điểm danh ngày này
            </button>
          )}
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="card" style={{ padding: "15px", display: "flex", gap: "15px", alignItems: "center", border: "1px solid #F0E1D9" }}>
        <select 
          value={selectedPC || ""} 
          onChange={(e) => setSelectedPC(Number(e.target.value))}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", width: "260px", outline: "none", color: "#6B4F43", fontSize: "13px" }}
        >
          {classes.map((c) => (
            <option key={c.maphancong} value={c.maphancong}>
              {c.malophoc} - {c.tenmon} ({c.tenlop})
            </option>
          ))}
        </select>
        
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", color: "#6B4F43" }}
        />
        
        <div style={{ flex: 1, position: "relative" }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm sinh viên..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "10px 15px 10px 40px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }} 
          />
          <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
        </div>
      </div>

      {/* ATTENDANCE SHEET TABLE & TABS CARD */}
      <section className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid #F0E1D9" }}>
        
        {/* Navigation Tabs Header */}
        <div style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F0E1D9", background: "#FDF8F5" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              onClick={() => setSubTab("list")}
              style={{ 
                padding: "8px 18px", borderRadius: "6px", 
                border: subTab === "list" ? "none" : "1px solid #EAD9CB", 
                background: subTab === "list" ? "#F2A8A8" : "white", 
                color: subTab === "list" ? "white" : "#6B4F43", 
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Danh sách điểm danh
            </button>
            <button 
              onClick={() => setSubTab("qrcode")}
              style={{ 
                padding: "8px 18px", borderRadius: "6px", 
                border: subTab === "qrcode" ? "none" : "1px solid #EAD9CB", 
                background: subTab === "qrcode" ? "#F2A8A8" : "white", 
                color: subTab === "qrcode" ? "white" : "#6B4F43", 
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              QR Code
            </button>
            <button 
              onClick={() => setSubTab("leave_requests")}
              style={{ 
                padding: "8px 18px", borderRadius: "6px", 
                border: subTab === "leave_requests" ? "none" : "1px solid #EAD9CB", 
                background: subTab === "leave_requests" ? "#F2A8A8" : "white", 
                color: subTab === "leave_requests" ? "white" : "#6B4F43", 
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "8px",
                transition: "all 0.2s"
              }}
            >
              Đơn xin nghỉ học
              {leaveRequests.filter(r => r.status === "Chờ duyệt").length > 0 && (
                <span style={{ 
                  background: "#EB5757", color: "white", fontSize: "10px", 
                  padding: "1px 6px", borderRadius: "10px", fontWeight: "bold" 
                }}>
                  {leaveRequests.filter(r => r.status === "Chờ duyệt").length}
                </span>
              )}
            </button>
          </div>
          {subTab === "list" && selectedBH && (
            <button
              onClick={() => setIsFaceModalOpen(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                color: "#2D1B14",
                fontSize: "13px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(242, 168, 168, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              📷 Điểm danh khuôn mặt
            </button>
          )}
        </div>

        {/* ================= VIEW 1: ACTIVE STUDENT CHECKLIST ================= */}
        {subTab === "list" && (
          <div style={{ padding: "10px 20px" }}>
            {!selectedBH ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#8B6F5F" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Ngày này chưa có ca học nào được kích hoạt.</p>
                <button 
                  onClick={handleCreateSession}
                  style={{ marginTop: "15px", padding: "10px 20px", background: "#F2A8A8", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                >
                  Kích hoạt ca điểm danh mới
                </button>
              </div>
            ) : filteredRoster.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#8B6F5F" }}>Không tìm thấy sinh viên nào</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F0E1D9" }}>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Mã SV</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Họ và tên</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Trạng thái điểm danh</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Thời gian</th>
                    <th style={{ padding: "12px", fontSize: "13px", color: "#8B6F5F" }}>Ghi chú nhanh</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((row) => (
                    <tr key={row.mssv} style={{ borderBottom: "1px solid #F9F9F9" }}>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{row.mssv}</td>
                      <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#6B4F43" }}>{row.name}</td>
                      <td style={{ padding: "12px" }}>
                        <select
                          value={row.status}
                          onChange={(e) => handleStatusChange(row.mssv, e.target.value)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1.5px solid",
                            borderColor: row.type === "red" ? "#FCD4D4" : row.type === "orange" ? "#FFEAD2" : "#D1F7E9",
                            background: row.type === "red" ? "#FFF5F5" : row.type === "orange" ? "#FFFBF7" : "#F4FDF9",
                            color: row.type === "red" ? "#EB5757" : row.type === "orange" ? "#F2994A" : "#178A57",
                            fontWeight: "bold",
                            fontSize: "12px",
                            outline: "none",
                            cursor: "pointer"
                          }}
                        >
                          <option value="Có mặt">Có mặt</option>
                          <option value="Vắng">Vắng</option>
                          <option value="Đi muộn">Đi muộn</option>
                          <option value="Vắng có phép">Vắng có phép</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px", fontSize: "13px" }}>{row.time}</td>
                      <td style={{ padding: "12px" }}>
                        <input
                          type="text"
                          value={row.note === "-" ? "" : row.note}
                          placeholder="Nhập ghi chú..."
                          onChange={(e) => handleNoteChange(row.mssv, e.target.value || "-")}
                          style={{
                            width: "200px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #EAD9CB",
                            fontSize: "12.5px",
                            outline: "none"
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ================= VIEW 2: DYNAMIC QR CODE SIMULATOR ================= */}
        {subTab === "qrcode" && (
          <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "15px" }}>
            {!selectedBH ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#8B6F5F" }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Vui lòng kích hoạt ca điểm danh cho ngày này trước khi sử dụng mã QR.</p>
              </div>
            ) : (() => {
              const currentSession = allSessions.find(s => s.mabuoihoc === selectedBH);
              const qrSecret = currentSession?.qr_secret;
              
              if (!qrSecret) {
                return (
                  <div style={{ padding: "20px", textAlign: "center", color: "#8B6F5F", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Buổi học này chưa được tạo mã QR điểm danh.</p>
                    <button 
                      onClick={handleRefreshQR}
                      className={styles.primaryBtn}
                      style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "8px 20px" }}
                    >
                      ⚡ Tạo Mã QR điểm danh
                    </button>
                  </div>
                );
              }

              const qrData = `qlsv-attendance:${selectedBH}:${qrSecret}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=6B4F43&bgcolor=FDF8F5&data=${encodeURIComponent(qrData)}`;

              return (
                <>
                  <div style={{ padding: "20px", background: "white", border: "1.5px solid #F0E1D9", borderRadius: "15px", boxShadow: "0 6px 18px rgba(0,0,0,0.05)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <img 
                      src={qrUrl} 
                      alt="Attendance QR Code" 
                      style={{ width: "180px", height: "180px", display: "block" }} 
                    />
                  </div>
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                    <h4 style={{ margin: "5px 0", color: "#6B4F43", fontWeight: "bold" }}>Mã QR quét điểm danh lớp học</h4>
                    <p style={{ margin: 0, fontSize: "12.5px", color: "#8B6F5F" }}>
                      Mã QR điểm danh cố định được lưu trữ bảo mật trên hệ thống.
                    </p>
                    <button 
                      onClick={handleRefreshQR}
                      style={{ 
                        marginTop: "8px", padding: "8px 16px", borderRadius: "8px", 
                        border: "1.5px solid #EAD9CB", background: "white", color: "#6B4F43", 
                        fontWeight: "600", fontSize: "12.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" 
                      }}
                    >
                      🔄 Tạo lại Mã QR mới
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ================= VIEW 3: LEAVE REQUESTS INBOX ================= */}
        {subTab === "leave_requests" && (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            
            {leaveRequests.length === 0 ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#8B6F5F" }}>
                Không có đơn xin nghỉ học nào.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {leaveRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="card" 
                    style={{ 
                      padding: "20px", 
                      border: "1px solid #F0E1D9", 
                      background: req.status === "Chờ duyệt" ? "#FFFDFB" : "#FFF",
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "12px",
                      transition: "all 0.2s"
                    }}
                  >
                    
                    {/* Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "#8B6F5F", textTransform: "uppercase" }}>MSSV: {req.mssv} • {req.class}</span>
                        <h4 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#6B4F43", fontWeight: "bold" }}>{req.name}</h4>
                      </div>
                      
                      {/* Status Tag */}
                      <span style={{ 
                        fontSize: "11.5px", padding: "4px 10px", borderRadius: "5px", fontWeight: "bold",
                        background: req.status === "Chờ duyệt" ? "#FFF8F0" : req.status === "Đã duyệt" ? "#EAFDF5" : "#FFEAEA",
                        color: req.status === "Chờ duyệt" ? "#F2994A" : req.status === "Đã duyệt" ? "#178A57" : "#EB5757"
                      }}>
                        {req.status}
                      </span>
                    </div>

                    {/* Details Body */}
                    <div style={{ fontSize: "13.5px", color: "#6B4F43", lineHeight: "1.5" }}>
                      <p style={{ margin: "4px 0" }}>📅 <b>Ngày xin nghỉ học:</b> <span style={{ color: "#EB5757", fontWeight: "bold" }}>{req.dateRequested}</span></p>
                      <p style={{ margin: "4px 0" }}>✍️ <b>Lý do xin phép:</b> {req.reason}</p>
                      
                      {req.evidence !== "Khong_co" && (
                        <p style={{ margin: "8px 0 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                          📎 <b>Minh chứng đính kèm:</b> 
                          <a 
                            href={req.evidence}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: "#039BE5", textDecoration: "underline", cursor: "pointer", fontWeight: "600" 
                            }}
                          >
                            Xem minh chứng
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {req.status === "Chờ duyệt" && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #F5EAE1", paddingTop: "12px", marginTop: "4px" }}>
                        <button 
                          onClick={() => handleRejectLeave(req.id)}
                          style={{ 
                            background: "#FFF4F4", color: "#EB5757", border: "1px solid #FCD4D4", 
                            padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          ✕ Từ chối đơn
                        </button>
                        <button 
                          onClick={() => handleApproveLeave(req.id, req.mssv)}
                          style={{ 
                            background: "linear-gradient(90deg, #6FCF97 0%, #27AE60 100%)", color: "white", border: "none",
                            padding: "8px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer",
                            boxShadow: "0 4px 10px rgba(111, 207, 151, 0.3)",
                            transition: "all 0.2s"
                          }}
                        >
                          ✓ Duyệt phép vắng
                        </button>
                      </div>
                    )}
                    
                    {/* Timestamp Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8B6F5F", marginTop: "4px" }}>
                      <span>Thời gian nộp đơn: {req.dateSubmitted}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </section>

      {/* Face Attendance Modal */}
      <FaceAttendanceModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        roster={roster}
        onMarkPresent={async (mssv) => {
          await handleStatusChange(mssv, "Có mặt");
        }}
      />
    </div>
  );
}
