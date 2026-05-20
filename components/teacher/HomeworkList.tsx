"use client";

import { useState, useEffect } from "react";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/service/auth/auth.service";

interface Homework {
  id: number;
  title: string;
  description: string;
  class: string;
  date: string;
  isoDate: string;
  done: number;
  total: number;
  color: string;
  bg: string;
  label: string;
  maxScore: number;
}

export function HomeworkList() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState<Homework | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [newTaskData, setNewTaskData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    hannop: ""
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/giangvien/tasks");
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
      }
      
      const classRes = await apiFetch("/api/giangvien/grades");
      const classJson = await classRes.json();
      if (classJson.success) {
        setClasses(classJson.data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks or classes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    
    setSaving(true);
    try {
      const res = await apiFetch(`/api/giangvien/tasks/${editTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTask.title,
          description: editTask.description,
          isoDate: editTask.isoDate
        })
      });
      const json = await res.json();
      if (json.success) {
        setEditTask(null);
        fetchTasks();
      } else {
        alert("Lỗi khi lưu bài tập: " + json.error);
      }
    } catch (err) {
      alert("Lỗi kết nối khi lưu bài tập");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.maphancong) {
      alert("Vui lòng chọn lớp học");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/giangvien/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaskData)
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setNewTaskData({ maphancong: "", tieude: "", mota: "", hannop: "" });
        fetchTasks();
      } else {
        alert("Lỗi khi tạo bài tập: " + json.error);
      }
    } catch (err) {
      alert("Lỗi kết nối khi tạo bài tập");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Quản lý Bài tập Lớp học</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Theo dõi thời hạn nộp bài và chấm điểm bài làm sinh viên</p>
        </div>
        <div>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
          >
            + Giao bài tập
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: "16px", display: "flex", gap: "16px", border: "1px solid #F0E1D9" }}>
        <input 
          type="text" 
          placeholder="🔍 Tìm kiếm tên bài tập hoặc chủ đề..." 
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }}
        />
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#8B6F5F" }}>Đang tải danh sách bài tập...</p>
      ) : tasks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#8B6F5F" }}>Chưa có bài tập nào được giao.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {tasks.map((item) => (
            <div key={item.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #F0E1D9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#2D1B14", fontWeight: "bold" }}>{item.title}</h3>
                <span style={{ backgroundColor: item.bg, color: item.color, padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "10px" }}>{item.label}</span>
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
                  <div style={{ width: `${item.total > 0 ? (item.done / item.total) * 100 : 0}%`, height: "100%", backgroundColor: "#F2A8A8" }}></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button 
                  onClick={() => setEditTask(item)}
                  style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}
                >Sửa</button>
                <button 
                  style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", fontWeight: "600" }} 
                  onClick={() => router.push(`/teacher/grades`)}
                >Chấm bài</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#FFF", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, color: "#6B4F43" }}>Chỉnh sửa Bài tập</h3>
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Tiêu đề</label>
                <input 
                  type="text" 
                  value={editTask.title} 
                  onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Mô tả</label>
                <textarea 
                  value={editTask.description || ""} 
                  onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                  rows={3}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Hạn nộp</label>
                <input 
                  type="datetime-local" 
                  value={editTask.isoDate ? editTask.isoDate.slice(0, 16) : ""} 
                  onChange={(e) => setEditTask({...editTask, isoDate: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none" }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setEditTask(null)} disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "#FFF", cursor: "pointer", color: "#6B4F43" }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: "#F2A8A8", color: "white", cursor: "pointer", fontWeight: "bold" }}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#FFF", padding: "24px", borderRadius: "12px", width: "400px", maxWidth: "90%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, color: "#6B4F43" }}>Giao bài tập mới</h3>
            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Lớp học phần</label>
                <select 
                  value={newTaskData.maphancong} 
                  onChange={(e) => setNewTaskData({...newTaskData, maphancong: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none", color: "#6B4F43" }}
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.map((c: any) => (
                    <option key={c.maphancong} value={c.maphancong}>
                      {c.lop?.tenlop} - {c.monhoc?.tenmon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Tiêu đề</label>
                <input 
                  type="text" 
                  value={newTaskData.tieude} 
                  onChange={(e) => setNewTaskData({...newTaskData, tieude: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Mô tả</label>
                <textarea 
                  value={newTaskData.mota} 
                  onChange={(e) => setNewTaskData({...newTaskData, mota: e.target.value})}
                  rows={3}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none", resize: "vertical" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px" }}>Hạn nộp</label>
                <input 
                  type="datetime-local" 
                  value={newTaskData.hannop} 
                  onChange={(e) => setNewTaskData({...newTaskData, hannop: e.target.value})}
                  required
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #EAD9CB", outline: "none" }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "#FFF", cursor: "pointer", color: "#6B4F43" }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "none", background: "#F2A8A8", color: "white", cursor: "pointer", fontWeight: "bold" }}>
                  {saving ? "Đang giao..." : "Giao bài tập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
