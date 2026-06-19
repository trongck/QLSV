"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeacherTasks, TaskItem } from "@/hooks/giangvien/useTeacherTasks";
import { useTeacherGrades } from "@/hooks/giangvien/useTeacherGrades";

const getViewerUrl = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase();
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
};

export function HomeworkList() {
  const router = useRouter();
  
  const {
    tasks,
    submissions,
    loading: tasksLoading,
    submissionsLoading: loadingSubmissions,
    createTask,
    updateTask,
    fetchSubmissions,
  } = useTeacherTasks();

  const {
    classes,
    loading: classesLoading,
  } = useTeacherGrades();

  const loading = tasksLoading || classesLoading;

  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newTaskData, setNewTaskData] = useState({
    maphancong: "",
    tieude: "",
    mota: "",
    hannop: ""
  });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);

  const [viewSubmissionsTask, setViewSubmissionsTask] = useState<TaskItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleViewSubmissions = async (task: TaskItem) => {
    setViewSubmissionsTask(task);
    await fetchSubmissions(task.id);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", editTask.title);
      formData.append("description", editTask.description);
      formData.append("isoDate", editTask.isoDate);
      if (editFile) {
        formData.append("file", editFile);
      }

      await updateTask(editTask.id, formData);
      setEditTask(null);
      setEditFile(null);
    } catch (err) {
      // Error handled by hook
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
      const formData = new FormData();
      formData.append("maphancong", newTaskData.maphancong);
      formData.append("tieude", newTaskData.tieude);
      formData.append("mota", newTaskData.mota);
      formData.append("hannop", newTaskData.hannop);
      if (createFile) {
        formData.append("file", createFile);
      }

      await createTask(formData);
      setShowCreateModal(false);
      setNewTaskData({ maphancong: "", tieude: "", mota: "", hannop: "" });
      setCreateFile(null);
    } catch (err) {
      // Error handled by hook
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
             Giao bài tập
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: "16px", display: "flex", gap: "16px", border: "1px solid #F0E1D9" }}>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm tên bài tập hoặc chủ đề..." 
          style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }}
        />
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#8B6F5F" }}>Đang tải danh sách bài tập...</p>
      ) : tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
        <p style={{ textAlign: "center", color: "#8B6F5F" }}>Chưa có bài tập nào phù hợp.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
            <div key={item.id} className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid #F0E1D9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#2D1B14", fontWeight: "bold" }}>{item.title}</h3>
                <span style={{ backgroundColor: item.bg, color: item.color, padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", whiteSpace: "nowrap", marginLeft: "10px" }}>{item.label}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#8B6F5F" }}>
                <p style={{ margin: "4px 0" }}><b style={{ color: "#6B4F43" }}>Lớp học:</b> {item.class}</p>
                <p style={{ margin: "4px 0" }}><b style={{ color: "#6B4F43" }}>Hạn nộp bài:</b> {item.date}</p>
                {item.filedinhUrl && (
                  <p style={{ margin: "4px 0" }}>
                    <a href={getViewerUrl(item.filedinhUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#178A57", textDecoration: "underline", fontWeight: "bold" }}>Tài liệu đính kèm</a>
                  </p>
                )}
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
                  onClick={() => { setEditTask(item); setEditFile(null); }}
                  style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "white", color: "#6B4F43", cursor: "pointer" }}
                >Sửa</button>
                <button 
                  style={{ flex: 1, padding: "8px", fontSize: "12px", borderRadius: "6px", border: "none", background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", color: "white", cursor: "pointer", fontWeight: "600" }} 
                  onClick={() => handleViewSubmissions(item)}
                >Xem bài nộp</button>
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
              
              <div style={{ background: "#FDF8F5", padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px", fontWeight: "600" }}>File đính kèm thay thế (Tùy chọn)</label>
                {editTask.filedinhUrl && <div style={{ fontSize: "12px", color: "#F2A8A8", marginBottom: "8px" }}>Bài tập này đang có file đính kèm. Tải file mới lên sẽ thay thế file cũ.</div>}
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                  onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: "100%", fontSize: "13px", color: "#6B4F43" }}
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
              
              <div style={{ background: "#FDF8F5", padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#8B6F5F", marginBottom: "4px", fontWeight: "600" }}>Tài liệu đính kèm (Word/PDF...)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                  onChange={(e) => setCreateFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: "100%", fontSize: "13px", color: "#6B4F43" }}
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

      {/* Submissions Modal */}
      {viewSubmissionsTask && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#FFF", padding: "24px", borderRadius: "12px", width: "600px", maxWidth: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <h3 style={{ marginTop: 0, color: "#6B4F43" }}>Danh sách nộp bài - {viewSubmissionsTask.title}</h3>
            
            <div style={{ flex: 1, overflowY: "auto", margin: "10px 0", borderTop: "1px solid #F0E1D9", borderBottom: "1px solid #F0E1D9", padding: "10px 0" }}>
              {loadingSubmissions ? (
                <p style={{ textAlign: "center", color: "#8B6F5F" }}>Đang tải...</p>
              ) : submissions.length === 0 ? (
                <p style={{ textAlign: "center", color: "#8B6F5F" }}>Chưa có sinh viên nào nộp bài.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {submissions.map((sub: any) => (
                    <div key={sub.manopbai} style={{ padding: "12px", background: "#FDF8F5", borderRadius: "8px", border: "1px solid #F0E1D9" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", color: "#2D1B14" }}>{sub.hoten} ({sub.masv})</span>
                        <span style={{ fontSize: "12px", color: "#8B6F5F" }}>
                          {new Date(sub.thoigiannop).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      
                      {sub.noidungnop && (
                        <div style={{ fontSize: "13px", color: "#6B4F43", marginBottom: "8px", padding: "8px", background: "white", borderRadius: "6px", border: "1px solid #EAD9CB" }}>
                          {sub.noidungnop}
                        </div>
                      )}

                      {sub.filenop && (
                        <a 
                          href={getViewerUrl(sub.filenop)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: "inline-block", fontSize: "12px", color: "#178A57", textDecoration: "none", background: "#EAFDF5", padding: "6px 12px", borderRadius: "6px", fontWeight: "bold" }}
                        >
                          Xem File Nộp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => setViewSubmissionsTask(null)} 
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #EAD9CB", background: "#FFF", cursor: "pointer", color: "#6B4F43", fontWeight: "bold", marginTop: "10px" }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
