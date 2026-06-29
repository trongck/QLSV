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
    deleteTask,
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
    <div className="flex flex-col gap-5 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Quản lý Bài tập Lớp học</h2>
          <p className="text-[13px] text-[#8B6F5F] m-0 mt-1">Theo dõi thời hạn nộp bài và chấm điểm bài làm sinh viên</p>
        </div>
        <div className="w-full md:w-auto">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl border-none btn-teacher text-white cursor-pointer font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity"
          >
             Giao bài tập
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl p-4 flex gap-4 border border-[#F0E1D9] shadow-sm">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm tên bài tập hoặc chủ đề..." 
          className="flex-1 px-4 py-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
        />
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <p className="text-center text-[#8B6F5F]">Đang tải danh sách bài tập...</p>
      ) : tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
        <p className="text-center text-[#8B6F5F]">Chưa có bài tập nào phù hợp.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-5 flex flex-col gap-4 border border-[#F0E1D9] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="m-0 text-base text-[#2D1B14] font-bold">{item.title}</h3>
                <span className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap ml-2.5" style={{ backgroundColor: item.bg, color: item.color }}>{item.label}</span>
              </div>
              <div className="text-[13px] text-[#8B6F5F] space-y-1">
                <p className="m-0"><b className="text-[#6B4F43]">Lớp học:</b> {item.class}</p>
                <p className="m-0"><b className="text-[#6B4F43]">Hạn nộp bài:</b> {item.date}</p>
                {item.filedinhUrl && (
                  <p className="m-0 mt-1">
                    <a href={getViewerUrl(item.filedinhUrl)} target="_blank" rel="noopener noreferrer" className="text-[#178A57] underline font-bold hover:text-[#065F46]">Tài liệu đính kèm</a>
                  </p>
                )}
              </div>
              <div className="mt-auto">
                <div className="flex justify-between text-xs mb-1 text-[#8B6F5F]">
                  <span>Tiến độ sinh viên nộp bài</span>
                  <span className="text-[#F2A8A8] font-bold">{item.done}/{item.total}</span>
                </div>
                <div className="h-1.5 bg-[#F9F9F9] rounded-full border border-[#F0E1D9] overflow-hidden">
                  <div className="h-full bg-[#F2A8A8]" style={{ width: `${item.total > 0 ? (item.done / item.total) * 100 : 0}%` }}></div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => { setEditTask(item); setEditFile(null); }}
                  className="flex-1 py-2 px-2 text-xs rounded-lg border border-[#EAD9CB] bg-white text-[#6B4F43] cursor-pointer hover:bg-gray-50 transition-colors font-semibold"
                >Sửa</button>
                <button 
                  onClick={() => handleViewSubmissions(item)}
                  className="flex-1 py-2 px-2 text-xs rounded-lg border-none btn-teacher text-white cursor-pointer font-bold hover:opacity-90 transition-opacity"
                >Xem bài nộp</button>
                <button 
                  onClick={() => deleteTask(item.id)}
                  className="py-2 px-2.5 text-xs rounded-lg border border-red-200 bg-white text-red-500 cursor-pointer hover:bg-red-50 transition-colors font-semibold"
                >Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-[400px] shadow-lg">
            <h3 className="mt-0 mb-4 text-lg text-[#6B4F43] font-bold">Chỉnh sửa Bài tập</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Tiêu đề</label>
                <input 
                  type="text" 
                  value={editTask.title} 
                  onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                  required
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Mô tả</label>
                <textarea 
                  value={editTask.description || ""} 
                  onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none resize-y text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Hạn nộp</label>
                <input 
                  type="datetime-local" 
                  value={editTask.isoDate ? editTask.isoDate.slice(0, 16) : ""} 
                  onChange={(e) => setEditTask({...editTask, isoDate: e.target.value})}
                  required
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              
              <div className="bg-[#FDF8F5] p-3 rounded-lg border border-[#F0E1D9]">
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-bold">File đính kèm thay thế (Tùy chọn)</label>
                {editTask.filedinhUrl && <div className="text-xs text-[#F2A8A8] mb-2">Bài tập này đang có file đính kèm. Tải file mới lên sẽ thay thế file cũ.</div>}
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                  onChange={(e) => setEditFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-[13px] text-[#6B4F43] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              
              <div className="flex gap-2.5 mt-2">
                <button type="button" onClick={() => setEditTask(null)} disabled={saving} className="flex-1 py-2.5 rounded-lg border border-[#EAD9CB] bg-white cursor-pointer text-[#6B4F43] font-semibold hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-lg border-none btn-teacher text-white cursor-pointer font-bold ${saving ? 'opacity-70' : 'hover:opacity-90'}`}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-[400px] shadow-lg">
            <h3 className="mt-0 mb-4 text-lg text-[#6B4F43] font-bold">Giao bài tập mới</h3>
            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Lớp học phần</label>
                <select 
                  value={newTaskData.maphancong} 
                  onChange={(e) => setNewTaskData({...newTaskData, maphancong: e.target.value})}
                  required
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none text-[13px] text-[#6B4F43] focus:border-[#F2A8A8] transition-colors bg-white"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes.filter((c: any) => c.hocky?.danghieuluc).map((c: any) => (
                    <option key={c.maphancong} value={c.maphancong}>
                      {c.lop?.tenlop} - {c.monhoc?.tenmon}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Tiêu đề</label>
                <input 
                  type="text" 
                  value={newTaskData.tieude} 
                  onChange={(e) => setNewTaskData({...newTaskData, tieude: e.target.value})}
                  required
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Mô tả</label>
                <textarea 
                  value={newTaskData.mota} 
                  onChange={(e) => setNewTaskData({...newTaskData, mota: e.target.value})}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none resize-y text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] text-[#8B6F5F] mb-1 font-semibold">Hạn nộp</label>
                <input 
                  type="datetime-local" 
                  value={newTaskData.hannop} 
                  onChange={(e) => setNewTaskData({...newTaskData, hannop: e.target.value})}
                  required
                  className="w-full p-2.5 rounded-lg border border-[#EAD9CB] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors"
                />
              </div>
              
              <div className="bg-[#FDF8F5] p-3 rounded-lg border border-[#F0E1D9]">
                <label className="block text-[13px] text-[#8B6F5F] mb-2 font-bold">Tài liệu đính kèm (Word/PDF...)</label>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx,.zip,.rar"
                  onChange={(e) => setCreateFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-[13px] text-[#6B4F43] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
              
              <div className="flex gap-2.5 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} disabled={saving} className="flex-1 py-2.5 rounded-lg border border-[#EAD9CB] bg-white cursor-pointer text-[#6B4F43] font-semibold hover:bg-gray-50 transition-colors">Hủy</button>
                <button type="submit" disabled={saving} className={`flex-1 py-2.5 rounded-lg border-none btn-teacher text-white cursor-pointer font-bold ${saving ? 'opacity-70' : 'hover:opacity-90'}`}>
                  {saving ? "Đang giao..." : "Giao bài tập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {viewSubmissionsTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-[600px] max-h-[80vh] flex flex-col shadow-lg">
            <h3 className="mt-0 mb-4 text-lg text-[#6B4F43] font-bold border-b border-[#F0E1D9] pb-3">Danh sách nộp bài - {viewSubmissionsTask.title}</h3>
            
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
              {loadingSubmissions ? (
                <p className="text-center text-[#8B6F5F] py-4">Đang tải...</p>
              ) : submissions.length === 0 ? (
                <p className="text-center text-[#8B6F5F] py-4">Chưa có sinh viên nào nộp bài.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {submissions.map((sub: any) => (
                    <div key={sub.manopbai} className="p-3 bg-[#FDF8F5] rounded-xl border border-[#F0E1D9]">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-[#2D1B14] text-sm">{sub.hoten} ({sub.masv})</span>
                        <span className="text-[12px] text-[#8B6F5F]">
                          {new Date(sub.thoigiannop).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      
                      {sub.noidungnop && (
                        <div className="text-[13px] text-[#6B4F43] mb-2 p-2.5 bg-white rounded-lg border border-[#EAD9CB]">
                          {sub.noidungnop}
                        </div>
                      )}

                      {sub.filenop && (
                        <a 
                          href={getViewerUrl(sub.filenop)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block text-[12px] text-[#178A57] no-underline bg-[#EAFDF5] px-3 py-1.5 rounded-lg font-bold hover:bg-[#D1FBE4] transition-colors"
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
              className="w-full mt-4 p-2.5 rounded-lg border border-[#EAD9CB] bg-white cursor-pointer text-[#6B4F43] font-bold hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
