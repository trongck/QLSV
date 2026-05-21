"use client";

import { useState, useEffect } from "react";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import { apiFetch } from "@/services/service/auth/auth.service";

export function ExamRoom() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamIdx, setActiveExamIdx] = useState(0);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [classes, setClasses] = useState<any[]>([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTaskData, setNewTaskData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: "",
    matkhau: ""
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [editExamData, setEditExamData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: "",
    matkhau: ""
  });

  useEffect(() => {
    const fetchExamsAndClasses = async () => {
      try {
        const res = await apiFetch("/api/giangvien/exams");
        const json = await res.json();
        if (json.success) {
          setExams(json.data);
        }

        const classRes = await apiFetch("/api/giangvien/grades");
        const classJson = await classRes.json();
        if (classJson.success) {
          setClasses(classJson.data);
        }
      } catch (err) {
        console.error("Failed to fetch exams or classes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExamsAndClasses();
  }, []);

  const handleEndExam = async () => {
    if (exams.length === 0) return;
    const activeExam = exams[activeExamIdx];
    if (activeExam.thoigianketthuc && new Date(activeExam.thoigianketthuc) <= new Date()) {
      alert("Ca thi này đã kết thúc.");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn kết thúc ca thi này? Sinh viên sẽ không thể nộp bài nữa.")) return;

    try {
      const res = await apiFetch(`/api/giangvien/exams/${activeExam.madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_EXAM" })
      });
      const json = await res.json();
      if (json.success) {
        alert("Đã kết thúc ca thi.");
        setExams(prev => {
          const newExams = [...prev];
          newExams[activeExamIdx].thoigianketthuc = new Date().toISOString();
          return newExams;
        });
      } else {
        alert("Lỗi: " + json.error);
      }
    } catch (err) {
      alert("Lỗi hệ thống khi kết thúc ca thi");
    }
  };

  const openEditExam = () => {
    if (exams.length === 0) return;
    const activeExam = exams[activeExamIdx];
    setEditExamData({
      maphancong: activeExam.maphancong?.toString() || "",
      tieude: activeExam.tieude || "",
      mota: activeExam.mota || "",
      thoigianlam: activeExam.thoigianlam || 60,
      thoigianbatdau: activeExam.thoigianbatdau ? activeExam.thoigianbatdau.slice(0, 16) : "",
      thoigianketthuc: activeExam.thoigianketthuc ? activeExam.thoigianketthuc.slice(0, 16) : "",
      matkhau: activeExam.matkhau || ""
    });
    setUploadFile(null);
    setShowEditExamModal(true);
  };

  const handleEditExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exams.length === 0) return;
    const activeExam = exams[activeExamIdx];

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("action", "UPDATE_EXAM");
      formData.append("maphancong", editExamData.maphancong);
      formData.append("tieude", editExamData.tieude);
      formData.append("mota", editExamData.mota);
      formData.append("thoigianlam", editExamData.thoigianlam.toString());
      formData.append("thoigianbatdau", editExamData.thoigianbatdau);
      formData.append("thoigianketthuc", editExamData.thoigianketthuc);
      formData.append("matkhau", editExamData.matkhau);
      
      if (uploadFile) {
        formData.append("file", uploadFile);
      }

      const res = await apiFetch(`/api/giangvien/exams/${activeExam.madethi}`, {
        method: "PUT",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        alert("Cập nhật đề thi thành công");
        setShowEditExamModal(false);
        // Reload exams
        const reloadRes = await apiFetch("/api/giangvien/exams");
        const reloadJson = await reloadRes.json();
        if (reloadJson.success) {
          setExams(reloadJson.data);
        }
      } else {
        alert("Lỗi: " + json.error);
      }
    } catch (err) {
      alert("Lỗi kết nối khi cập nhật đề thi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.maphancong) {
      alert("Vui lòng chọn lớp học phần");
      return;
    }
    if (!uploadFile) {
      alert("Vui lòng chọn file đề thi (PDF hoặc Word)");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("maphancong", newTaskData.maphancong);
      formData.append("tieude", newTaskData.tieude);
      formData.append("mota", newTaskData.mota);
      formData.append("thoigianlam", newTaskData.thoigianlam.toString());
      formData.append("thoigianbatdau", newTaskData.thoigianbatdau);
      formData.append("thoigianketthuc", newTaskData.thoigianketthuc);
      formData.append("matkhau", newTaskData.matkhau);
      formData.append("file", uploadFile);

      const res = await apiFetch("/api/giangvien/exams", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        alert("Tạo đề thi mới bằng AI thành công!");
        setShowCreateModal(false);
        setNewTaskData({
          maphancong: "",
          tieude: "",
          mota: "",
          thoigianlam: 60,
          thoigianbatdau: "",
          thoigianketthuc: "",
          matkhau: ""
        });
        setUploadFile(null);
        
        // Reload and select first
        const reloadRes = await apiFetch("/api/giangvien/exams");
        const reloadJson = await reloadRes.json();
        if (reloadJson.success) {
          setExams(reloadJson.data);
          setActiveExamIdx(0);
        }
      } else {
        alert("Lỗi tạo đề thi: " + json.error);
      }
    } catch (err) {
      alert("Lỗi hệ thống khi tải lên đề thi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px", color: "#8B6F5F" }}>Đang tải dữ liệu ca thi...</div>;
  }

  if (exams.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Giao diện giám sát Thi trực tuyến</h2>
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "#8B6F5F", border: "1px solid #F0E1D9" }}>
          Hiện tại không có ca thi trực tuyến nào đang diễn ra cho các lớp của bạn.
        </div>
      </div>
    );
  }

  const activeExam = exams[activeExamIdx];
  const questions = activeExam.cauhoi || [];
  const activeQuestion = questions[activeQIdx];
  const isEnded = activeExam.thoigianketthuc && new Date(activeExam.thoigianketthuc) <= new Date();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
      {/* LEFT SIDEBAR: Exam List */}
      <div style={{ flex: "1 1 300px", maxWidth: "400px", minWidth: "250px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "5px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#6B4F43", margin: "0 0 5px 0" }}>Ca thi / Lịch thi</h2>
        
        {exams.map((ex, idx) => {
          const isSelected = activeExamIdx === idx;
          const isExEnded = ex.thoigianketthuc && new Date(ex.thoigianketthuc) <= new Date();
          return (
            <div 
              key={ex.madethi} 
              onClick={() => setActiveExamIdx(idx)}
              style={{ 
                padding: "16px", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                background: isSelected ? "#FDF8F5" : "white",
                border: isSelected ? "1px solid #F2A8A8" : "1px solid #F0E1D9",
                boxShadow: isSelected ? "0 4px 12px rgba(242, 168, 168, 0.15)" : "none"
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "bold", color: isSelected ? "#D65D5D" : "#2D1B14", marginBottom: "6px" }}>{ex.tieude}</div>
              <div style={{ fontSize: "13px", color: "#8B6F5F" }}>{ex.tenmon} - {ex.tenlop}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#8B6F5F", display: "flex", alignItems: "center", gap: "4px" }}>
                  {ex.thoigianbatdau ? new Date(ex.thoigianbatdau).toLocaleDateString("vi-VN") : "--/--"}
                </span>
                <span style={{ 
                  fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px",
                  background: isExEnded ? "#FFF0F0" : "#FDF8F5",
                  color: isExEnded ? "#D65D5D" : "#6B4F43"
                }}>
                  {isExEnded ? "Đã kết thúc" : "Đang mở"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: "3 1 600px", minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "calc(100vh - 100px)", overflowY: "auto", paddingRight: "10px" }}>
        {/* Header Section */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "15px", background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #F0E1D9", boxShadow: "0 2px 10px rgba(107, 79, 67, 0.05)" }}>
          <div style={{ flex: "1 1 300px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#2D1B14", margin: 0 }}>{activeExam.tieude}</h2>
            <p style={{ fontSize: "14px", color: "#8B6F5F", margin: "8px 0 0" }}>
              {activeExam.tenmon} - {activeExam.tenlop} | Bắt đầu: {activeExam.thoigianbatdau ? new Date(activeExam.thoigianbatdau).toLocaleString('vi-VN') : "--"}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button 
              onClick={() => setShowCreateModal(true)}
              style={{ background: "#FDF8F5", border: "1px solid #F2A8A8", color: "#D65D5D", padding: "10px 18px", fontWeight: "600", cursor: "pointer", borderRadius: "10px", fontSize: "14px", transition: "all 0.2s" }}
            >
              Tạo đề thi mới
            </button>
            <button 
              onClick={openEditExam}
              style={{ background: "white", border: "1px solid #EAD9CB", color: "#6B4F43", padding: "10px 18px", fontWeight: "600", cursor: "pointer", borderRadius: "10px", fontSize: "14px", transition: "all 0.2s" }}
            >
              Sửa đề thi
            </button>
            <button 
              onClick={handleEndExam}
              disabled={isEnded}
              style={{ background: isEnded ? "#F0E1D9" : "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 18px", fontWeight: "600", cursor: isEnded ? "not-allowed" : "pointer", border: "none", color: isEnded ? "#8B6F5F" : "white", borderRadius: "10px", fontSize: "14px", transition: "all 0.2s" }}
            >
              {isEnded ? "Ca thi đã kết thúc" : "Kết thúc ca thi"}
            </button>
          </div>
        </div>

        {/* QUICK STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 2px 10px rgba(107, 79, 67, 0.05)" }}>
            <div style={{ fontSize: "14px", color: "#8B6F5F", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              Thời gian làm bài
            </div>
            <div style={{ fontSize: "28px", color: "#6B4F43", fontWeight: "bold" }}>{activeExam.thoigianlam || "--"} <span style={{ fontSize: "16px", fontWeight: "normal", color: "#8B6F5F" }}>phút</span></div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 2px 10px rgba(107, 79, 67, 0.05)" }}>
            <div style={{ fontSize: "14px", color: "#8B6F5F", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              Sinh viên đã nộp bài
            </div>
            <div style={{ fontSize: "28px", color: "#6B4F43", fontWeight: "bold" }}>{activeExam.ketquathi?.length || 0} <span style={{ fontSize: "16px", fontWeight: "normal", color: "#8B6F5F" }}>SV</span></div>
          </div>
          <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 2px 10px rgba(107, 79, 67, 0.05)" }}>
            <div style={{ fontSize: "14px", color: "#8B6F5F", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              Cảnh báo gian lận
            </div>
            <div style={{ fontSize: "28px", color: "#D65D5D", fontWeight: "bold" }}>
              {activeExam.ketquathi?.filter((r: any) => r.trangthai === 'ViPham').length || 0} <span style={{ fontSize: "16px", fontWeight: "normal", color: "#D65D5D" }}>SV</span>
            </div>
          </div>
        </div>

        {/* AI PROCTORING TABLE */}
        <section style={{ flex: 1, background: "white", padding: "24px", borderRadius: "16px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 2px 10px rgba(107, 79, 67, 0.05)" }}>
          <div>
            <h3 style={{ fontSize: "18px", color: "#2D1B14", fontWeight: "bold", margin: "0 0 5px 0" }}>Giám sát AI Proctoring</h3>
            <p style={{ fontSize: "14px", color: "#8B6F5F", margin: 0 }}>Theo dõi hành vi sinh viên trong quá trình làm bài thi trực tuyến.</p>
          </div>
          
          <div style={{ width: "100%", overflowX: "auto", border: "1px solid #F0E1D9", borderRadius: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#FDF8F5", color: "#6B4F43", textAlign: "left" }}>
                  <th style={{ padding: "16px", fontWeight: "bold", borderBottom: "1px solid #F0E1D9" }}>Học sinh</th>
                  <th style={{ padding: "16px", fontWeight: "bold", borderBottom: "1px solid #F0E1D9" }}>Trạng thái</th>
                  <th style={{ padding: "16px", fontWeight: "bold", borderBottom: "1px solid #F0E1D9", textAlign: "center" }}>Điểm số</th>
                  <th style={{ padding: "16px", fontWeight: "bold", borderBottom: "1px solid #F0E1D9" }}>Live cheat vi phạm</th>
                </tr>
              </thead>
              <tbody>
                {activeExam.ketquathi && activeExam.ketquathi.length > 0 ? (
                  activeExam.ketquathi.map((result: any, idx: number) => {
                    // Read from actual database columns instead of mocking
                    const isCheat = result.trangthai === 'ViPham';
                    const cheatWarningText = result.ghichu || "Đã ghi nhận vi phạm";

                    let statusText = "Đang làm";
                    let statusBg = "#FDF8F5";
                    let statusColor = "#6B4F43";
                    
                    if (result.trangthai === 'DaNop') {
                      statusText = "Đã nộp bài";
                      statusBg = "#EAFDF5";
                      statusColor = "#178A57";
                    } else if (result.trangthai === 'ViPham') {
                      statusText = "Vi phạm";
                      statusBg = "#FFF0F0";
                      statusColor = "#D65D5D";
                    } else if (result.trangthai === 'HetGio') {
                      statusText = "Hết giờ";
                      statusBg = "#F0E1D9";
                      statusColor = "#8B6F5F";
                    }
                    
                    return (
                      <tr key={result.maketqua} style={{ borderBottom: "1px solid #F0E1D9", background: isCheat ? "#FFFDFD" : "white" }}>
                        <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#F2A8A8", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "14px" }}>
                            {result.sinhvien?.hoten ? result.sinhvien.hoten.charAt(0) : "S"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#2D1B14" }}>{result.sinhvien?.hoten || "Sinh viên"}</div>
                            <div style={{ fontSize: "12px", color: "#8B6F5F" }}>{result.masv}</div>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ background: statusBg, color: statusColor, padding: "6px 10px", borderRadius: "8px", fontWeight: "600", fontSize: "12px", border: `1px solid ${statusBg === "#FDF8F5" ? "#F0E1D9" : statusBg === "#EAFDF5" ? "#BFEFDB" : statusBg === "#FFF0F0" ? "#FAD1D1" : "#EAD9CB"}` }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center", fontWeight: "bold", color: "#6B4F43", fontSize: "16px" }}>
                          {result.diemtong != null ? `${result.diemtong}` : "--"}
                        </td>
                        <td style={{ padding: "16px" }}>
                          {isCheat ? (
                            <span style={{ background: "#FFF0F0", color: "#D65D5D", padding: "8px 12px", borderRadius: "8px", fontSize: "13px", border: "1px solid #FAD1D1", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                              {cheatWarningText}
                            </span>
                          ) : (
                            <span style={{ color: "#8B6F5F", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                              Bình thường
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "40px", color: "#8B6F5F" }}>
                      Chưa có học sinh nào nộp bài hoặc bị ghi nhận vi phạm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* CREATE EXAM MODAL */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(45, 27, 20, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateExamSubmit} style={{ background: "white", padding: "30px", borderRadius: "16px", width: "500px", maxWidth: "95%", display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #F0E1D9", boxShadow: "0 10px 30px rgba(107, 79, 67, 0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#6B4F43", fontWeight: "bold", fontSize: "18px", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px" }}>Tạo đề thi mới (AI Import)</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Lớp học phần *</label>
              <select 
                required
                value={newTaskData.maphancong} 
                onChange={e => setNewTaskData(prev => ({ ...prev, maphancong: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              >
                <option value="">-- Chọn lớp học phần --</option>
                {classes.map((c: any) => (
                  <option key={c.maphancong} value={c.maphancong}>{c.tenmon} - {c.tenlop}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Tiêu đề đề thi *</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Kiểm tra giữa kỳ Tin học đại cương"
                value={newTaskData.tieude}
                onChange={e => setNewTaskData(prev => ({ ...prev, tieude: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Mô tả ngắn</label>
              <textarea 
                placeholder="VD: Đề thi không sử dụng tài liệu"
                value={newTaskData.mota}
                onChange={e => setNewTaskData(prev => ({ ...prev, mota: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43", minHeight: "60px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời lượng (phút) *</label>
                <input 
                  type="number" 
                  required 
                  min={5}
                  value={newTaskData.thoigianlam}
                  onChange={e => setNewTaskData(prev => ({ ...prev, thoigianlam: Number(e.target.value) }))}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Mật khẩu ca thi (nếu có)</label>
                <input 
                  type="text" 
                  placeholder="VD: 123456"
                  value={newTaskData.matkhau}
                  onChange={e => setNewTaskData(prev => ({ ...prev, matkhau: e.target.value }))}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian bắt đầu ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={newTaskData.thoigianbatdau}
                onChange={e => setNewTaskData(prev => ({ ...prev, thoigianbatdau: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian kết thúc ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={newTaskData.thoigianketthuc}
                onChange={e => setNewTaskData(prev => ({ ...prev, thoigianketthuc: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>File tài liệu đề thi (.docx, .doc, .pdf) *</label>
              <input 
                type="file" 
                required 
                accept=".docx,.doc,.pdf"
                onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                style={{ padding: "8px 0", fontSize: "13px", color: "#6B4F43" }}
              />
              <span style={{ fontSize: "11px", color: "#8B6F5F" }}>AI sẽ tự động đọc file và tạo danh sách câu hỏi trắc nghiệm tương ứng.</span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                style={{ background: "#F5F5F5", border: "1px solid #EAD9CB", color: "#6B4F43", padding: "10px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", border: "none", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                {submitting ? "Đang xử lý AI & tạo đề..." : "Import & Tạo đề"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT EXAM MODAL */}
      {showEditExamModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(45, 27, 20, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleEditExamSubmit} style={{ background: "white", padding: "30px", borderRadius: "16px", width: "500px", maxWidth: "95%", display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #F0E1D9", boxShadow: "0 10px 30px rgba(107, 79, 67, 0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#6B4F43", fontWeight: "bold", fontSize: "18px", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px" }}>Sửa đề thi trực tuyến</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Lớp học phần *</label>
              <select 
                required
                value={editExamData.maphancong} 
                onChange={e => setEditExamData(prev => ({ ...prev, maphancong: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              >
                <option value="">-- Chọn lớp học phần --</option>
                {classes.map((c: any) => (
                  <option key={c.maphancong} value={c.maphancong}>{c.tenmon} - {c.tenlop}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Tiêu đề đề thi *</label>
              <input 
                type="text" 
                required 
                placeholder="VD: Kiểm tra giữa kỳ"
                value={editExamData.tieude}
                onChange={e => setEditExamData(prev => ({ ...prev, tieude: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Mô tả ngắn</label>
              <textarea 
                value={editExamData.mota}
                onChange={e => setEditExamData(prev => ({ ...prev, mota: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43", minHeight: "60px", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời lượng (phút) *</label>
                <input 
                  type="number" 
                  required 
                  min={5}
                  value={editExamData.thoigianlam}
                  onChange={e => setEditExamData(prev => ({ ...prev, thoigianlam: Number(e.target.value) }))}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Mật khẩu ca thi</label>
                <input 
                  type="text" 
                  value={editExamData.matkhau}
                  onChange={e => setEditExamData(prev => ({ ...prev, matkhau: e.target.value }))}
                  style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian bắt đầu ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={editExamData.thoigianbatdau}
                onChange={e => setEditExamData(prev => ({ ...prev, thoigianbatdau: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian kết thúc ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={editExamData.thoigianketthuc}
                onChange={e => setEditExamData(prev => ({ ...prev, thoigianketthuc: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "10px", background: "#FDF8F5", borderRadius: "8px", border: "1px solid #F0E1D9" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>File tài liệu đề thi mới (Tùy chọn)</label>
              <input 
                type="file" 
                accept=".docx,.doc,.pdf"
                onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
                style={{ padding: "5px 0", fontSize: "13px", color: "#6B4F43" }}
              />
              <span style={{ fontSize: "11px", color: "#8B6F5F" }}>Nếu tải file mới lên, hệ thống AI sẽ phân tích và <strong>thay thế toàn bộ</strong> câu hỏi cũ của đề thi này. Nếu để trống, câu hỏi cũ được giữ nguyên.</span>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setShowEditExamModal(false)}
                disabled={submitting}
                style={{ background: "#F5F5F5", border: "1px solid #EAD9CB", color: "#6B4F43", padding: "10px 15px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}
              >
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", border: "none", color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer", fontSize: "13px" }}
              >
                {submitting ? "Đang xử lý..." : "Cập nhật đề thi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

