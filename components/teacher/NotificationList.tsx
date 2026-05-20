"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { apiFetch } from "@/services/service/auth/auth.service";
import styles from "@/app/(dashboard)/teacher/dashboard/teacher-dashboard.module.css";

interface ThongBao {
  mathongbao: number;
  mataikhoantao: string;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  malop: string | null;
  maphancong: number | null;
  ngayhethan: string | null;
  ghim: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  dadoc: boolean;
  thoigiandoc: string | null;
  taikhoan?: { email: string; vaitro: string };
  lop?: { tenlop: string };
}

export function NotificationList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ThongBao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tất cả thông báo");
  const [markedAll, setMarkedAll] = useState(false);

  // Detailed view modal state
  const [selectedNote, setSelectedNote] = useState<ThongBao | null>(null);

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
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      let url = "/api/giangvien/notifications?limit=50";
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (filterType !== "Tất cả thông báo") {
        let typeParam = "";
        if (filterType === "Quan trọng") typeParam = "Khancap";
        else if (filterType === "Cảnh báo AI") typeParam = "Khancap";
        else if (filterType === "Lớp học" || filterType === "Học tập") typeParam = "Hoctap";
        else if (filterType === "Thông báo") typeParam = "Chung";
        
        if (typeParam) url += `&loai=${typeParam}`;
      }
      const res = await apiFetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectNote = async (note: ThongBao) => {
    setSelectedNote(note);
    if (!note.dadoc) {
      try {
        const res = await apiFetch("/api/giangvien/notifications", {
          method: "PATCH",
          body: JSON.stringify({ mathongbao: note.mathongbao, dadoc: true }),
        });
        const json = await res.json();
        if (json.success) {
          setNotifications(prev =>
            prev.map(n =>
              n.mathongbao === note.mathongbao ? { ...n, dadoc: true } : n
            )
          );
        }
      } catch (err) {
        console.error("Lỗi tự động đánh dấu đã đọc khi xem chi tiết:", err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [search, filterType]);

  useEffect(() => {
    // Fetch classes taught by the teacher to populate target class select
    apiFetch("/api/giangvien/classes")
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.dsLop) {
          setTeacherClasses(json.data.dsLop);
        }
      })
      .catch(err => console.error("Lỗi tải lớp học:", err));
  }, []);

  const handleMarkAsRead = async (id: number, currentRead: boolean) => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        body: JSON.stringify({ mathongbao: id, dadoc: !currentRead }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev =>
          prev.map(note =>
            note.mathongbao === id ? { ...note, dadoc: !currentRead } : note
          )
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái đã đọc:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(note => ({ ...note, dadoc: true })));
        setMarkedAll(true);
      }
    } catch (err) {
      console.error("Lỗi đánh dấu đã đọc tất cả:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
      const res = await apiFetch(`/api/giangvien/notifications/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.filter(note => note.mathongbao !== id));
      } else {
        alert(json.error || "Không thể xóa thông báo");
      }
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
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tieude: newTitle.trim(),
          noidung: newContent.trim(),
          loai: newLoai,
          doituong: newDoituong,
          malop: newMalop || null,
          maphancong: newMaphancong ? Number(newMaphancong) : null,
          ngayhethan: newNgayhethan || null,
          ghim: newGhim,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        // Prepend new notification to the list
        setNotifications(prev => [json.data, ...prev]);
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
      } else {
        alert(json.error || "Tạo thông báo thất bại");
      }
    } catch (err) {
      console.error("Lỗi tạo thông báo:", err);
    }
  };

  const startEdit = (note: ThongBao) => {
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
      const res = await apiFetch(`/api/giangvien/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          tieude: editTitle,
          noidung: editContent
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setNotifications(prev =>
          prev.map(note =>
            note.mathongbao === id ? { ...note, ...json.data } : note
          )
        );
        setEditingId(null);
      } else {
        alert(json.error || "Không thể lưu chỉnh sửa");
      }
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

  const getSenderName = (note: ThongBao) => {
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#6B4F43", margin: 0 }}>Thông báo hệ thống &amp; lớp học</h2>
          <p style={{ fontSize: "13px", color: "#8B6F5F", margin: "4px 0 0" }}>Cập nhật tin tức quan trọng từ Nhà trường và các hoạt động giảng dạy</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#8B6F5F", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={markedAll}
              onChange={handleMarkAllAsRead}
              style={{ accentColor: "#F2A8A8" }} 
            /> Đánh dấu đã đọc tất cả
          </label>
          <button 
            className={styles.primaryBtn} 
            onClick={() => setIsCreateOpen(true)}
            style={{ background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)", padding: "10px 20px" }}
          >
            ➕ Tạo thông báo mới
          </button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="card" style={{ padding: "15px", display: "flex", gap: "15px", alignItems: "center", border: "1px solid #F0E1D9" }}>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "10px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", width: "200px", color: "#6B4F43" }}
        >
          <option>Tất cả thông báo</option>
          <option>Quan trọng</option>
          <option>Cảnh báo AI</option>
          <option>Lớp học</option>
        </select>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung thông báo..." 
            style={{ width: "100%", padding: "10px 15px", borderRadius: "8px", border: "1px solid #F0E1D9", outline: "none", fontSize: "13px" }} 
          />
        </div>
      </div>

      {/* NOTIFICATION LIST VIEWPORT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#8B6F5F" }}>Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#8B6F5F" }}>Không tìm thấy thông báo nào.</div>
        ) : (
          notifications.map((note) => {
            const details = getLoaiDetails(note.loai);
            const isMyNotification = note.mataikhoantao === user?.mataikhoan;

            return (
              <div 
                key={note.mathongbao} 
                className="card" 
                style={{ 
                  padding: "20px", 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "12px", 
                  border: "1px solid #F0E1D9",
                  background: !note.dadoc ? "#FFF9F9" : "#FFF",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div 
                    style={{ flex: 1, cursor: editingId === note.mathongbao ? "default" : "pointer" }}
                    onClick={() => editingId !== note.mathongbao && handleSelectNote(note)}
                  >
                    {editingId === note.mathongbao ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                        <input 
                          type="text" 
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #F0E1D9",
                            fontSize: "15px",
                            fontWeight: "700",
                            color: "#6B4F43",
                            outline: "none"
                          }}
                        />
                        <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #F0E1D9",
                            fontSize: "13px",
                            color: "#6B4F43",
                            outline: "none",
                            resize: "vertical"
                          }}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button 
                            className={styles.primaryBtn} 
                            onClick={() => saveEdit(note.mathongbao)}
                            style={{ padding: "6px 15px", fontSize: "12px", background: "#6B4F43" }}
                          >
                            Lưu
                          </button>
                          <button 
                            className={styles.primaryBtn} 
                            onClick={cancelEdit}
                            style={{ padding: "6px 15px", fontSize: "12px", background: "#BDBDBD" }}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h4 style={{ margin: 0, fontSize: "15px", color: "#6B4F43", fontWeight: !note.dadoc ? "700" : "500" }}>
                          {note.tieude}
                        </h4>
                        <div style={{ margin: "4px 0 0", fontSize: "13px", color: "#6B4F43" }}>
                          {renderContent(note.noidung)}
                        </div>
                        <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#8B6F5F" }}>
                          Người gửi: {getSenderName(note)} • {new Date(note.ngaytao).toLocaleDateString("vi-VN")}
                        </p>
                      </>
                    )}
                  </div>

                  <span style={{ 
                    padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600",
                    background: details.bg, color: details.color 
                  }}>
                    {details.label}
                  </span>

                  <div style={{ display: "flex", gap: "10px", marginLeft: "20px" }}>
                    <button 
                      onClick={() => handleMarkAsRead(note.mathongbao, note.dadoc)}
                      style={{ background: "none", border: "none", color: note.dadoc ? "#2D9CDB" : "#BDBDBD", cursor: "pointer", fontSize: "16px" }} 
                      title={note.dadoc ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}
                    >
                      đã đọc
                    </button>
                    
                    {isMyNotification && editingId !== note.mathongbao && (
                      <button 
                        onClick={() => startEdit(note)}
                        style={{ background: "none", border: "none", color: "#2D9CDB", cursor: "pointer", fontSize: "16px" }} 
                        title="Chỉnh sửa thông báo"
                      >
                        sửa 
                      </button>
                    )}

                    {isMyNotification && (
                      <button 
                        onClick={() => handleDelete(note.mathongbao)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#EB5757", fontSize: "16px" }} 
                        title="Xóa thông báo"
                      >
                        xoá 
                      </button>
                    )}
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
                <h2 className="text-xl font-bold text-[#6B4F43] leading-snug">
                  {selectedNote.tieude}
                </h2>
                <span style={{ 
                  padding: "6px 12px", 
                  borderRadius: "6px", 
                  fontSize: "11px", 
                  fontWeight: "600",
                  whiteSpace: "nowrap",
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
