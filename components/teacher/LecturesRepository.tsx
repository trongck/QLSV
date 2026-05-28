"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

interface Lecture {
  mabaigiang: string;
  magv: string;
  mamon: string;
  tieude: string;
  mota: string;
  loai_file: string;
  file_url: string;
  dungluong: number;
  thoigiantao: string;
  monhoc?: { tenmon: string };
}

export function LecturesRepository() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [uploadData, setUploadData] = useState({
    tieude: "",
    mota: "",
    mamon: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/giangvien/lectures");
      const json = await res.json();
      if (json.success) {
        setLectures(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiFetch("/api/giangvien/students"); // returns classes if no maphancong
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // We only need unique subjects for lectures, but class list is okay too
        setClasses(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLectures();
    fetchClasses();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Vui lòng chọn file");
      return;
    }
    if (!uploadData.mamon) {
      alert("Vui lòng chọn môn học/lớp học");
      return;
    }
    if (!uploadData.tieude) {
      alert("Vui lòng nhập tiêu đề");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tieude", uploadData.tieude);
      formData.append("mota", uploadData.mota);
      formData.append("mamon", uploadData.mamon);

      const res = await apiFetch("/api/giangvien/lectures", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Lỗi khi tải lên");
      }

      alert("Tải lên thành công!");
      setShowUploadModal(false);
      setUploadData({ tieude: "", mota: "", mamon: "" });
      setFile(null);
      fetchLectures();
    } catch (err: any) {
      alert(err.message);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài giảng này?")) return;
    try {
      const res = await apiFetch(`/api/giangvien/lectures/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error || "Lỗi khi xóa");
      }
      fetchLectures();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 min-h-[500px]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F0E1D9]">
        <h2 className="text-xl font-bold text-[#2D1B14] m-0 flex items-center gap-2">
          <span>📚</span> Quản lý Kho bài giảng
        </h2>
        <button
          onClick={() => setShowUploadModal(true)}
          className="h-10 px-5 bg-primary text-white rounded-xl border-none font-semibold cursor-pointer hover:opacity-90 flex items-center gap-2 transition-all shadow-sm"
        >
          <span>⬆️</span> Tải lên bài giảng
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-fg-muted font-medium">Đang tải danh sách bài giảng...</div>
      ) : lectures.length === 0 ? (
        <div className="text-center py-16 bg-[#FFF9F5] rounded-xl border border-[#F0E1D9] border-dashed">
          <div className="text-4xl mb-4">🗂️</div>
          <h3 className="text-[#6B4F43] mb-2">Chưa có bài giảng nào</h3>
          <p className="text-sm text-[#8B6F5F]">Hãy tải lên bài giảng đầu tiên của bạn để sinh viên có thể học tập.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lectures.map((l) => (
            <div key={l.mabaigiang} className="bg-white border border-[#EAD9CB] rounded-[14px] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="h-40 bg-[#F8F3EF] flex items-center justify-center relative overflow-hidden group">
                {l.loai_file === "video" ? (
                  <video src={l.file_url} className="w-full h-full object-cover" controls preload="metadata" />
                ) : l.loai_file === "image" ? (
                  <img src={l.file_url} alt={l.tieude} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-6xl">📄</div>
                )}
                {/* Delete overlay button */}
                <button 
                  onClick={() => handleDelete(l.mabaigiang)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white text-red-500 rounded-full border border-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                  title="Xóa bài giảng"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-[15px] font-bold text-[#2D1B14] m-0 mb-1 line-clamp-1" title={l.tieude}>{l.tieude}</h3>
                <div className="text-[12px] text-primary bg-[#FFF2EB] px-2 py-0.5 rounded-full self-start mb-2 font-medium">
                  {l.monhoc?.tenmon || l.mamon}
                </div>
                <p className="text-[13px] text-[#6B4F43] m-0 line-clamp-2 flex-1">{l.mota || "Không có mô tả"}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#F0E1D9] text-[11px] text-[#8B6F5F]">
                  <span>{new Date(l.thoigiantao).toLocaleDateString("vi-VN")}</span>
                  <span className="uppercase font-semibold tracking-wider">{l.loai_file}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[500px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#F0E1D9]">
              <h3 className="text-lg font-bold text-[#2D1B14] m-0">Tải lên bài giảng</h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-full border-none bg-[#F8F3EF] text-[#6B4F43] flex items-center justify-center cursor-pointer hover:bg-[#EAD9CB] transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#4A332A]">Thuộc môn / Lớp <span className="text-red-500">*</span></label>
                <select 
                  className="h-10 px-3 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  value={uploadData.mamon}
                  onChange={(e) => setUploadData({...uploadData, mamon: e.target.value})}
                  required
                >
                  <option value="">-- Chọn môn học --</option>
                  {classes.map(c => {
                    // Extract mamon safely since it's nested in monhoc
                    const mamon = c.monhoc?.mamon || c.mamon || c.maphancong;
                    const tenmon = c.monhoc?.tenmon || c.tenmon || "Không rõ";
                    const tenlop = c.lop?.tenlop || c.tenlop || "Không rõ";
                    return (
                      <option key={c.maphancong} value={mamon}>
                        {tenmon} - {tenlop}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#4A332A]">Tiêu đề bài giảng <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="h-10 px-3 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#A89F9A]"
                  placeholder="VD: Bài 1: Tổng quan về cơ sở dữ liệu"
                  value={uploadData.tieude}
                  onChange={(e) => setUploadData({...uploadData, tieude: e.target.value})}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#4A332A]">Mô tả</label>
                <textarea 
                  className="p-3 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] min-h-[80px] resize-y focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#A89F9A]"
                  placeholder="Ghi chú thêm về nội dung bài giảng..."
                  value={uploadData.mota}
                  onChange={(e) => setUploadData({...uploadData, mota: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#4A332A]">File bài giảng <span className="text-red-500">*</span></label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-[#EAD9CB] bg-[#F8F3EF] hover:bg-[#F0E1D9]'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    accept="video/mp4,video/webm,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                      }
                    }}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2 text-primary font-medium">
                      <div className="text-3xl">📄</div>
                      <span className="line-clamp-1 px-4">{file.name}</span>
                      <span className="text-xs text-[#8B6F5F] font-normal">{(file.size / (1024*1024)).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[#6B4F43]">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-primary mb-1">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                      </div>
                      <span className="font-semibold text-sm">Nhấn để chọn file</span>
                      <span className="text-xs text-[#A89F9A]">Hỗ trợ Video (MP4, WebM), Ảnh (PNG, JPG) và PDF</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 h-11 bg-[#F8F3EF] text-[#6B4F43] rounded-xl font-bold cursor-pointer hover:bg-[#EAD9CB] transition-colors border-none"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="flex-[2] h-11 bg-primary text-white rounded-xl font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border-none flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Đang xử lý...
                    </>
                  ) : "Tải lên ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
