"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTeacherNotifications, NotificationItem } from "@/hooks/giangvien/useTeacherNotifications";
import { useTeacherClasses } from "@/hooks/giangvien/useTeacherClasses";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

export function NotificationList() {
  const { user } = useAuth();
  
  const {
    notifications,
    loading,
    search,
    setSearch,
    setLoai,
    createNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
  } = useTeacherNotifications();

  const { dsLop: teacherClasses } = useTeacherClasses();

  const [filterType, setFilterType] = useState("Tất cả thông báo");
  const [markedAll, setMarkedAll] = useState(false);

  // Detailed view modal state
  const [selectedNote, setSelectedNote] = useState<NotificationItem | null>(null);

  // States for inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // States for creating a notification
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newLoai, setNewLoai] = useState("Chung");
  const [newDoituong, setNewDoituong] = useState("Tatca");
  const [newMalop, setNewMalop] = useState("");
  const [newMaphancong, setNewMaphancong] = useState("");
  const [newNgayhethan, setNewNgayhethan] = useState("");
  const [newGhim, setNewGhim] = useState(false);

  // Synchronize local filterType with the hook's loai filter
  useEffect(() => {
    let typeParam = "";
    if (filterType === "Quan trọng") typeParam = "Khancap";
    else if (filterType === "Cảnh báo AI") typeParam = "Khancap";
    else if (filterType === "Lớp học" || filterType === "Học tập") typeParam = "Hoctap";
    else if (filterType === "Thông báo") typeParam = "Chung";
    setLoai(typeParam);
  }, [filterType, setLoai]);

  const handleSelectNote = async (note: NotificationItem) => {
    setSelectedNote(note);
    if (!note.dadoc) {
      try {
        await markAsRead(note.mathongbao, false);
      } catch (err) {
        console.error("Lỗi tự động đánh dấu đã đọc khi xem chi tiết:", err);
      }
    }
  };

  // Tự động mở thông báo khi được chuyển tiếp từ Quả chuông trên Dashboard Giảng viên
  useEffect(() => {
    if (notifications.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const selectId = params.get("id");
      if (selectId) {
        const target = notifications.find((n) => n.mathongbao === Number(selectId));
        if (target) {
          handleSelectNote(target);
          // Xóa query param để khi reload không bị mở lại
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  }, [notifications]);

  const handleMarkAsRead = async (id: number, currentRead: boolean) => {
    try {
      await markAsRead(id, currentRead);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái đã đọc:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setMarkedAll(true);
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc tất cả:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
      await deleteNotification(id);
    } catch (err) {
      console.error("Lỗi xóa thông báo:", err);
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }

    try {
      await createNotification({
        tieude: newTitle.trim(),
        noidung: newContent.trim(),
        loai: newLoai,
        doituong: newDoituong,
        malop: newMalop || null,
        maphancong: newMaphancong ? Number(newMaphancong) : null,
        ngayhethan: newNgayhethan || null,
        ghim: newGhim,
      });
      setIsCreateOpen(false);
      // Reset state
      setNewTitle("");
      setNewContent("");
      setNewLoai("Chung");
      setNewDoituong("Tatca");
      setNewMalop("");
      setNewMaphancong("");
      setNewNgayhethan("");
      setNewGhim(false);
    } catch (err) {
      console.error("Lỗi tạo thông báo:", err);
    }
  };

  const startEdit = (note: NotificationItem) => {
    setEditingId(note.mathongbao);
    setEditTitle(note.tieude);
    setEditContent(note.noidung);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (id: number) => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }
    try {
      await updateNotification(id, {
        tieude: editTitle,
        noidung: editContent
      });
      setEditingId(null);
    } catch (err) {
      console.error("Lỗi lưu chỉnh sửa thông báo:", err);
    }
  };

  const getLoaiDetails = (loai: string) => {
    switch (loai) {
      case "Khancap":
        return { label: "Khẩn cấp", bg: "#FFF0F0", color: "#EB5757" };
      case "Hoctap":
        return { label: "Học tập", bg: "#FFF8F0", color: "#F2994A" };
      case "Thoikhoabieu":
        return { label: "Thời khóa biểu", bg: "#E8F5E9", color: "#2E7D32" };
      case "Baitap":
        return { label: "Bài tập", bg: "#FFF8F0", color: "#F2994A" };
      default:
        return { label: "Thông báo", bg: "#F0F5FF", color: "#2D9CDB" };
    }
  };

  const getSenderName = (note: NotificationItem) => {
    if (note.taikhoan?.vaitro === "Admin") return "Ban Giám Hiệu";
    if (note.taikhoan?.email) return note.taikhoan.email;
    return "Hệ thống";
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    const regex = /\[IMAGE_URL:([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }
      const imageUrl = match[1];
      parts.push(
        <div key={matchIndex} style={{ margin: "10px 0" }}>
          <img 
            src={imageUrl} 
            alt="Hình ảnh đính kèm" 
            style={{ 
              maxWidth: "100%", 
              maxHeight: "350px", 
              borderRadius: "8px", 
              border: "1px solid #EAD9CB",
              display: "block",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }} 
          />
        </div>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    return (
      <>
        {parts.map((part, idx) => {
          if (typeof part === "string") {
            return <span key={idx} style={{ whiteSpace: "pre-line" }}>{part}</span>;
          }
          return part;
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
        <div>
          <h2 className="text-xl font-bold text-[#6B4F43] m-0">Thông báo hệ thống &amp; lớp học</h2>
          <p className="text-[13px] text-[#8B6F5F] m-0 mt-1">Cập nhật tin tức quan trọng từ Nhà trường và các hoạt động giảng dạy</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-[13px] text-[#8B6F5F] cursor-pointer">
            <input 
              type="checkbox" 
              checked={markedAll}
              onChange={handleMarkAllAsRead}
              className="accent-[#F2A8A8]"
            /> Đánh dấu đã đọc tất cả
          </label>
          <button 
            className={`flex-1 md:flex-none ${styles.primaryBtn} px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2A8A8] to-[#FFB4B4] border-none text-white font-semibold cursor-pointer shadow-sm hover:opacity-90 transition-opacity`} 
            onClick={() => setIsCreateOpen(true)}
          >
             Tạo thông báo mới
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center border border-[#F0E1D9] shadow-sm">
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2.5 rounded-lg border border-[#F0E1D9] outline-none w-full sm:w-[200px] text-[#6B4F43] focus:border-[#F2A8A8] transition-colors"
        >
          <option>Tất cả thông báo</option>
          <option>Quan trọng</option>
          <option>Cảnh báo AI</option>
          <option>Lớp học</option>
        </select>
        <div className="flex-1 w-full">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung thông báo..." 
            className="w-full px-4 py-2.5 rounded-lg border border-[#F0E1D9] outline-none text-[13px] focus:border-[#F2A8A8] transition-colors" 
          />
        </div>
      </div>

      {/* NOTIFICATION LIST VIEWPORT */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="p-8 text-center text-[#8B6F5F]">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-[#8B6F5F]">Không tìm thấy thông báo nào.</div>
        ) : (
          notifications.map((note) => {
            const details = getLoaiDetails(note.loai);
            const isMyNotification = note.mataikhoantao === user?.mataikhoan;

            return (
              <div 
                key={note.mathongbao} 
                className={`bg-white rounded-xl p-5 flex flex-col gap-3 border border-[#F0E1D9] transition-all duration-200 shadow-sm hover:shadow-md ${!note.dadoc ? "bg-[#FFF9F9]" : "bg-white"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div 
                    className={`flex-1 ${editingId === note.mathongbao ? "cursor-default" : "cursor-pointer"}`}
                    onClick={() => editingId !== note.mathongbao && handleSelectNote(note)}
                  >
                    {editingId === note.mathongbao ? (
                      <div className="flex flex-col gap-2 w-full">
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-[#F0E1D9] text-[15px] font-bold text-[#6B4F43] outline-none focus:border-[#F2A8A8] transition-colors"
                        />
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="px-3 py-2 rounded-lg border border-[#F0E1D9] text-[13px] text-[#6B4F43] outline-none resize-y focus:border-[#F2A8A8] transition-colors"
                        />
                        <div className="flex gap-2.5">
                          <button 
                            className={`px-4 py-1.5 rounded text-xs font-semibold text-white bg-[#6B4F43] border-none cursor-pointer hover:bg-[#523C32] transition-colors`} 
                            onClick={() => saveEdit(note.mathongbao)}
                          >
                            Lưu
                          </button>
                          <button 
                            className={`px-4 py-1.5 rounded text-xs font-semibold text-white bg-[#BDBDBD] border-none cursor-pointer hover:bg-[#A3A3A3] transition-colors`} 
                            onClick={cancelEdit}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className={`m-0 text-[15px] text-[#6B4F43] ${!note.dadoc ? "font-bold" : "font-medium"}`}>
                            {note.tieude}
                          </h4>
                          <span className="px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap hidden sm:inline-block" style={{ background: details.bg, color: details.color }}>
                            {details.label}
                          </span>
                        </div>
                        <div className="mt-1 text-[13px] text-[#6B4F43] line-clamp-2">
                          {renderContent(note.noidung)}
                        </div>
                        <p className="m-0 mt-1.5 text-[11px] text-[#8B6F5F]">
                          Người gửi: {getSenderName(note)} • {new Date(note.ngaytao).toLocaleDateString("vi-VN")}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Actions & Badge on Mobile */}
                  <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                     <span className="px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap sm:hidden" style={{ background: details.bg, color: details.color }}>
                       {details.label}
                     </span>
                    <div className="flex gap-2.5">
                      <button 
                        onClick={() => handleMarkAsRead(note.mathongbao, note.dadoc)}
                        className="bg-transparent border-none cursor-pointer text-base p-1 hover:opacity-80 transition-opacity"
                        style={{ color: note.dadoc ? "#2D9CDB" : "#BDBDBD" }} 
                        title={note.dadoc ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                      >
                        đã đọc
                      </button>
                      
                      {isMyNotification && editingId !== note.mathongbao && (
                        <button 
                          onClick={() => startEdit(note)}
                          className="bg-transparent border-none cursor-pointer text-base p-1 text-[#2D9CDB] hover:opacity-80 transition-opacity"
                          title="Chỉnh sửa thông báo"
                        >
                          sửa 
                        </button>
                      )}

                      {isMyNotification && (
                        <button 
                          onClick={() => handleDelete(note.mathongbao)}
                          className="bg-transparent border-none cursor-pointer text-base p-1 text-[#EB5757] hover:opacity-80 transition-opacity"
                          title="Xóa thông báo"
                        >
                          xoá 
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[999] flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl w-full max-w-[550px] shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAD9CB] flex justify-between items-center bg-[#FFF2EB]">
              <h3 className="text-lg font-bold text-[#2D1B14]">Tạo thông báo mới</h3>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="p-1 text-[#8B6F5F] hover:bg-[#F3E5D8] rounded-full transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "65vh" }}>
              {/* Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="text-xs font-semibold text-[#8B6F5F]">Tiêu đề</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..." 
                  className="w-full text-sm p-2.5 rounded-lg border border-[#EAD9CB] focus:outline-none focus:border-[#C25450]"
                  style={{ outline: "none" }}
                />
              </div>

              {/* Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="text-xs font-semibold text-[#8B6F5F]">Nội dung</label>
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết..." 
                  rows={4}
                  className="w-full text-sm p-2.5 rounded-lg border border-[#EAD9CB] focus:outline-none focus:border-[#C25450] resize-y"
                  style={{ outline: "none" }}
                />
              </div>

              {/* Loai and Doituong */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="text-xs font-semibold text-[#8B6F5F]">Loại thông báo</label>
                  <select 
                    value={newLoai}
                    onChange={(e) => setNewLoai(e.target.value)}
                    className="w-full text-sm p-2.5 rounded-lg border border-[#EAD9CB] bg-white"
                    style={{ outline: "none" }}
                  >
                    <option value="Chung">Thông báo chung</option>
                    <option value="Hoctap">Học tập</option>
                    <option value="Thoikhoabieu">Thời khóa biểu</option>
                    <option value="Baitap">Bài tập</option>
                    <option value="Khancap">Khẩn cấp</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="text-xs font-semibold text-[#8B6F5F]">Đối tượng</label>
                  <select 
                    value={newDoituong}
                    onChange={(e) => {
                      setNewDoituong(e.target.value);
                      if (e.target.value !== "SinhVien") {
                        setNewMalop("");
                        setNewMaphancong("");
                      }
                    }}
                    className="w-full text-sm p-2.5 rounded-lg border border-[#EAD9CB] bg-white"
                    style={{ outline: "none" }}
                  >
                    <option value="Tatca">Tất cả</option>
                    <option value="GiangVien">Giảng viên</option>
                    <option value="SinhVien">Sinh viên</option>
                  </select>
                </div>
              </div>

              {/* Target Class (Only if target is SinhVien) */}
              {newDoituong === "SinhVien" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="text-xs font-semibold text-[#8B6F5F]">Lớp học phần</label>
                  <select 
                    value={newMaphancong}
                    onChange={(e) => {
                      setNewMaphancong(e.target.value);
                      const selected = teacherClasses.find(c => String(c.maphancong) === e.target.value);
                      setNewMalop(selected?.malop || "");
                    }}
                    className="w-full text-sm p-2.5 rounded-lg border border-[#EAD9CB] bg-white"
                    style={{ outline: "none" }}
                  >
                    <option value="">-- Chọn lớp học phần --</option>
                    {teacherClasses.map((c: any) => (
                      <option key={c.maphancong} value={c.maphancong}>
                        {c.tenlop} - {c.tenmon}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Expiry Date and Pin */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="text-xs font-semibold text-[#8B6F5F]">Ngày hết hạn (tùy chọn)</label>
                  <input 
                    type="date" 
                    value={newNgayhethan}
                    onChange={(e) => setNewNgayhethan(e.target.value)}
                    className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB]"
                    style={{ outline: "none" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px" }}>
                  <input 
                    type="checkbox" 
                    id="newGhim"
                    checked={newGhim}
                    onChange={(e) => setNewGhim(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#C25450" }}
                  />
                  <label htmlFor="newGhim" style={{ fontSize: "13px", fontWeight: "600", color: "#6B4F43", cursor: "pointer" }}>Ghim thông báo</label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF6F2] border-t border-[#EAD9CB] flex justify-end gap-3" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={() => setIsCreateOpen(false)} 
                className="px-4 py-2 border border-[#EAD9CB] text-[#6B4F43] rounded-lg text-sm hover:bg-[#F3E5D8] transition-colors"
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #EAD9CB", background: "white", cursor: "pointer" }}
              >
                Hủy
              </button>
              <button 
                onClick={handleCreate} 
                className="px-4 py-2 bg-[#C25450] text-white rounded-lg text-sm hover:bg-[#A9433F] transition-colors font-medium animate-fadeIn"
                style={{ padding: "8px 16px", borderRadius: "8px", background: "#C25450", color: "white", border: "none", cursor: "pointer" }}
              >
                Tạo thông báo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED VIEW MODAL */}
      {selectedNote && (
        <div 
          className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[999] flex items-center justify-center p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-[650px] max-h-[85vh] shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAD9CB] flex justify-between items-center bg-[#FFF2EB]">
              <div className="flex items-center gap-3">
                <span className="text-xl">📢</span>
                <h3 className="text-lg font-bold text-[#2D1B14]">Chi tiết thông báo</h3>
              </div>
              <button 
                onClick={() => setSelectedNote(null)}
                className="text-2xl text-[#8B6F5F] hover:text-[#2D1B14] transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              <div className="flex justify-between items-start gap-4">
                <h2 className="text-xl font-bold text-[#6B4F43] leading-snug m-0">
                  {selectedNote.tieude}
                </h2>
                <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap" style={{ 
                  background: getLoaiDetails(selectedNote.loai).bg, 
                  color: getLoaiDetails(selectedNote.loai).color 
                }}>
                  {getLoaiDetails(selectedNote.loai).label}
                </span>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#8B6F5F] border-b border-[#F0E1D9] pb-3" style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                <div>
                  <span className="font-semibold text-[#6B4F43]">Người gửi:</span> {getSenderName(selectedNote)}
                </div>
                <div>
                  <span className="font-semibold text-[#6B4F43]">Thời gian:</span> {new Date(selectedNote.ngaytao).toLocaleDateString("vi-VN")} {new Date(selectedNote.ngaytao).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                </div>
                {selectedNote.lop?.tenlop && (
                  <div>
                    <span className="font-semibold text-[#6B4F43]">Lớp học:</span> {selectedNote.lop.tenlop}
                  </div>
                )}
                {selectedNote.ngayhethan && (
                  <div>
                    <span className="font-semibold text-red-500">Hết hạn:</span> {new Date(selectedNote.ngayhethan).toLocaleDateString("vi-VN")}
                  </div>
                )}
              </div>

              {/* Rich Content Viewport */}
              <div className="text-sm text-[#4E3629] leading-relaxed break-words bg-[#FAF6F3] p-4 rounded-xl border border-[#F5ECE5]">
                {renderContent(selectedNote.noidung)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAD9CB] bg-[#FFF2EB] flex justify-end">
              <button 
                onClick={() => setSelectedNote(null)}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#6B4F43] hover:bg-[#523C32] transition-colors"
                style={{ background: "#6B4F43", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: "pointer" }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
