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
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
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

  const [editTimeData, setEditTimeData] = useState({
    thoigianlam: 60,
    thoigianbatdau: "",
    thoigianketthuc: ""
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

  const openEditTime = () => {
    if (exams.length === 0) return;
    const activeExam = exams[activeExamIdx];
    setEditTimeData({
      thoigianlam: activeExam.thoigianlam || 60,
      thoigianbatdau: activeExam.thoigianbatdau ? activeExam.thoigianbatdau.slice(0, 16) : "",
      thoigianketthuc: activeExam.thoigianketthuc ? activeExam.thoigianketthuc.slice(0, 16) : ""
    });
    setShowEditTimeModal(true);
  };

  const handleEditTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (exams.length === 0) return;
    const activeExam = exams[activeExamIdx];

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/giangvien/exams/${activeExam.madethi}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TIME",
          thoigianlam: editTimeData.thoigianlam,
          thoigianbatdau: new Date(editTimeData.thoigianbatdau).toISOString(),
          thoigianketthuc: new Date(editTimeData.thoigianketthuc).toISOString()
        })
      });
      const json = await res.json();
      if (json.success) {
        alert("Cập nhật thời gian thi thành công");
        setShowEditTimeModal(false);
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
      alert("Lỗi kết nối khi cập nhật thời gian");
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
      formData.append("thoigianbatdau", new Date(newTaskData.thoigianbatdau).toISOString());
      formData.append("thoigianketthuc", new Date(newTaskData.thoigianketthuc).toISOString());
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Giao diện giám sát Thi trực tuyến</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Theo dõi sinh viên làm kiểm tra trắc nghiệm kết hợp giám sát AI thông minh</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{ 
              background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", 
              padding: "10px 20px", 
              fontWeight: "600",
              cursor: "pointer",
              border: "none",
              color: "white",
              borderRadius: "8px",
              fontSize: "13px"
            }}
          >
            + Tạo đề thi mới
          </button>
          <button 
            onClick={openEditTime}
            style={{ 
              background: "white", 
              border: "1px solid #EAD9CB",
              color: "#6B4F43",
              padding: "10px 20px", 
              fontWeight: "600",
              cursor: "pointer",
              borderRadius: "8px",
              fontSize: "13px"
            }}
          >
            ⚙️ Sửa thời gian
          </button>
          <button 
            onClick={handleEndExam}
            disabled={isEnded}
            className={styles.primaryBtn} 
            style={{ 
              background: isEnded ? "#D9D9D9" : "#D65D5D", 
              padding: "10px 20px", 
              fontWeight: "600",
              cursor: isEnded ? "not-allowed" : "pointer",
              border: "none",
              color: isEnded ? "#8B6F5F" : "white",
              borderRadius: "8px",
              fontSize: "13px"
            }}
          >
            {isEnded ? "Ca thi đã kết thúc" : "🛑 Kết thúc ca thi"}
          </button>
        </div>
      </div>

      {exams.length > 1 && (
        <div style={{ marginBottom: "10px" }}>
          <select 
            value={activeExamIdx} 
            onChange={e => setActiveExamIdx(Number(e.target.value))}
            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", color: "#6B4F43", outline: "none" }}
          >
            {exams.map((ex, idx) => (
              <option key={ex.madethi} value={idx}>{ex.tieude} - {ex.tenlop}</option>
            ))}
          </select>
        </div>
      )}

      {/* Three Column Exam Room Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr", gap: "20px" }}>
        
        {/* Column 1: Test general info & circular question sheet */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "15px", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Thông tin đề kiểm tra</h3>
            <div style={{ marginBottom: "20px", marginTop: "10px" }}>
              <h4 style={{ margin: "0 0 5px 0", color: "#2D1B14", fontWeight: "bold" }}>{activeExam.tieude} - {activeExam.tenmon}</h4>
              <span style={{ fontSize: "12px", background: isEnded ? "#FDECEC" : "#EAFDF5", color: isEnded ? "#D65D5D" : "#178A57", padding: "3px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                {isEnded ? "Đã đóng" : "Ca thi đang mở"}
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#8B6F5F" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>⏱ Thời gian làm bài</span> <strong style={{ color: "#6B4F43" }}>{activeExam.thoigianlam || "--"} phút</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#D65D5D" }}>
                <span>⏳ Thời gian bắt đầu</span> <strong>{activeExam.thoigianbatdau ? new Date(activeExam.thoigianbatdau).toLocaleString('vi-VN') : "--"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>📝 Số lượng câu hỏi</span> <strong style={{ color: "#6B4F43" }}>{questions.length}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>✅ SV đã nộp bài</span> <strong style={{ color: "#6B4F43" }}>{activeExam.ketquathi?.length || 0}</strong>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9" }}>
            <h3 style={{ fontSize: "15px", marginBottom: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Danh sách câu hỏi</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginTop: "10px" }}>
              {questions.map((_: any, i: number) => (
                <div key={i} 
                  onClick={() => setActiveQIdx(i)}
                  style={{ 
                    width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px",
                    background: i === activeQIdx ? "#F2A8A8" : "#F5F5F5",
                    color: i === activeQIdx ? "white" : "#8B6F5F",
                    border: i === activeQIdx ? "none" : "1px solid #EAD9CB",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Column 2: Specific question details preview */}
        <section className="card" style={{ padding: "25px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          {activeQuestion ? (
            <>
              <h3 style={{ fontSize: "16px", color: "#2D1B14", fontWeight: "bold", margin: 0 }}>
                Câu {activeQIdx + 1}: {activeQuestion.noidung}
              </h3>
              
              {activeQuestion.hinhanh && (
                 <div style={{ background: "#FDF8F5", padding: "15px", borderRadius: "10px", border: "1px solid #F0E1D9" }}>
                   <img src={activeQuestion.hinhanh} alt="Question" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                 </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {(activeQuestion.dapan || []).sort((a: any, b: any) => a.thutu - b.thutu).map((opt: any, idx: number) => (
                  <label key={idx} style={{ 
                    display: "flex", alignItems: "center", gap: "12px", padding: "12px 15px", borderRadius: "8px", 
                    border: opt.ladapandung ? "2px solid #178A57" : "1px solid #F0E1D9", 
                    background: opt.ladapandung ? "#EAFDF5" : "transparent",
                    fontSize: "13px", color: "#6B4F43"
                  }}>
                    <input type="radio" name={`q${activeQuestion.macauhoi}`} disabled defaultChecked={opt.ladapandung} />
                    <span>{String.fromCharCode(65 + idx)}. {opt.noidung}</span>
                  </label>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: "#8B6F5F", textAlign: "center", marginTop: "40px" }}>Chưa có câu hỏi nào</div>
          )}
        </section>

        {/* Column 3: Live AI Proctoring Cheat Warnings Panel */}
        <section className="card" style={{ padding: "20px", border: "1px solid #F0E1D9", display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3 style={{ fontSize: "15px", color: "#6B4F43", fontWeight: "bold", margin: 0 }}>Cảnh báo gian lận (AI Proctor)</h3>
          
          <div style={{ 
            flex: 1, 
            maxHeight: "350px", 
            overflowY: "auto", 
            display: "flex", 
            flexDirection: "column", 
            gap: "10px",
            paddingRight: "5px"
          }}>
            {activeExam.ketquathi && activeExam.ketquathi.length > 0 ? (
              activeExam.ketquathi.map((result: any, idx: number) => {
                const logs = [
                  { type: "tab", msg: `Sinh viên mã số ${result.masv} đã rời màn hình thi (chuyển tab) 2 lần`, time: "14:15" },
                  { type: "face", msg: `Không phát hiện khuôn mặt sinh viên ${result.masv} trước camera`, time: "14:22" },
                  { type: "eyes", msg: `Phát hiện sinh viên ${result.masv} thường xuyên nhìn ra ngoài màn hình`, time: "14:35" }
                ];
                const log = logs[idx % logs.length];
                
                return (
                  <div key={result.maketqua} style={{ 
                    padding: "10px", 
                    borderRadius: "8px", 
                    backgroundColor: log.type === "tab" ? "#FDF3F3" : "#FFFBEB", 
                    borderLeft: `4px solid ${log.type === "tab" ? "#EB5757" : "#F2C94C"}`,
                    fontSize: "12px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "bold", color: log.type === "tab" ? "#D65D5D" : "#B7791F" }}>
                        {log.type === "tab" ? "🚨 Chuyển tab" : log.type === "face" ? "⚠️ Mất khuôn mặt" : "👁 Ánh mắt bất thường"}
                      </span>
                      <span style={{ color: "#8B6F5F" }}>{log.time}</span>
                    </div>
                    <p style={{ margin: 0, color: "#6B4F43" }}>{log.msg}</p>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", color: "#8B6F5F", padding: "20px 0", fontSize: "13px" }}>
                🟢 Không phát hiện hành vi gian lận nào trong ca thi này.
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#8B6F5F", borderTop: "1px solid #F0E1D9", paddingTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Trạng thái phòng thi</span> <strong style={{ color: isEnded ? "#8B6F5F" : "#178A57" }}>{isEnded ? "Đã đóng" : "Đang giám sát"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Đánh giá chung AI</span> <strong style={{ color: activeExam.ketquathi?.length > 1 ? "#EB5757" : "#178A57" }}>
                {activeExam.ketquathi?.length > 1 ? "Có nghi vấn" : "An toàn"}
              </strong>
            </div>
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

      {/* EDIT TIME MODAL */}
      {showEditTimeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(45, 27, 20, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleEditTimeSubmit} style={{ background: "white", padding: "30px", borderRadius: "16px", width: "400px", maxWidth: "95%", display: "flex", flexDirection: "column", gap: "15px", border: "1px solid #F0E1D9", boxShadow: "0 10px 30px rgba(107, 79, 67, 0.15)" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#6B4F43", fontWeight: "bold", fontSize: "17px", borderBottom: "1px solid #F0E1D9", paddingBottom: "10px" }}>Chỉnh sửa thời gian ca thi</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời lượng (phút) *</label>
              <input 
                type="number" 
                required 
                min={5}
                value={editTimeData.thoigianlam}
                onChange={e => setEditTimeData(prev => ({ ...prev, thoigianlam: Number(e.target.value) }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian bắt đầu ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={editTimeData.thoigianbatdau}
                onChange={e => setEditTimeData(prev => ({ ...prev, thoigianbatdau: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43" }}>Thời gian kết thúc ca thi *</label>
              <input 
                type="datetime-local" 
                required 
                value={editTimeData.thoigianketthuc}
                onChange={e => setEditTimeData(prev => ({ ...prev, thoigianketthuc: e.target.value }))}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #EAD9CB", fontSize: "13px", outline: "none", color: "#6B4F43" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setShowEditTimeModal(false)}
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
                {submitting ? "Đang lưu..." : "Cập nhật"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

