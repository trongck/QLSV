"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  BookOpen,
  BarChart2,
  Users,
  FileText,
  Calendar,
  CheckCircle,
  Upload,
  Loader2,
  Send,
  X,
  Paperclip,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { apiFetch, tokenStorage } from "@/services/service/auth/auth.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

interface Assignment {
  mabaitap: number;
  tieude: string;
  mota: string | null;
  filedinh: string | null;
  hannop: string;
  loai: string;
  ngaytao: string;
  maphancong: number;
  phancong?: {
    monhoc: { mamon: string; tenmon: string } | null;
    giangvien: { magv: string; hoten: string } | null;
  };
  nopbai?: {
    manopbai: number;
    thoigiannop: string;
    trenop: boolean;
    diem: number | null;
    nhanxet: string | null;
    filenop: string | null;
    noidungnop: string | null;
  } | null;
}

const LOAI_CONFIG: Record<string, { icon: any; color: string }> = {
  Baitap: { icon: BookOpen, color: "bg-purple-100 text-purple-600" },
  Thuchanh: { icon: BarChart2, color: "bg-green-100 text-green-600" },
  Nhom: { icon: Users, color: "bg-orange-100 text-orange-600" },
  Tracnghiem: { icon: FileText, color: "bg-red-100 text-red-600" },
  Doan: { icon: BarChart2, color: "bg-blue-100 text-blue-600" },
};

const resolveFileUrl = (pathOrUrl: string | null) => {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("/uploads/") || pathOrUrl.startsWith("uploads/")) {
    return pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mjyxgwodxvntotsnuads.supabase.co";
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  
  const parts = cleanPath.split("/");
  if (parts.length > 1) {
    const bucket = parts[0];
    const pathInBucket = parts.slice(1).join("/");
    const knownBuckets = ["attachments", "assignments", "tasks", "documents", "tailieu"];
    if (knownBuckets.includes(bucket.toLowerCase())) {
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathInBucket}`;
    }
  }
  
  return `${supabaseUrl}/storage/v1/object/public/attachments/${cleanPath}`;
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    // Always display in Vietnam timezone (UTC+7), explicit to avoid server/client mismatch
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return dateStr;
  }
};

export default function AssignmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Submit states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const submitFileRef = useRef<HTMLInputElement>(null);

  // Submission detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Assignment | null>(null);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/student/assignment");
      const json = await res.json();
      if (json.success) {
        setAssignments(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user, fetchAssignments]);

  const openSubmitModal = (item: Assignment) => {
    setSubmitTarget(item);
    setSubmitText(item.nopbai?.noidungnop ?? "");
    setSubmitFile(null);
    setSubmitFileUrl(item.nopbai?.filenop ?? null);
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async () => {
    if (!submitTarget) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    let filenop: string | null = submitFileUrl;
    try {
      // Upload file nếu có chọn file mới
      if (submitFile) {
        const token = tokenStorage.getAccessToken() || '';
        const formData = new FormData();
        formData.append('file', submitFile);
        const upRes = await fetch('/api/student/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const upJson = await upRes.json();
        if (!upJson.success) throw new Error(upJson.message || 'Upload file thất bại.');
        filenop = `${upJson.url}?name=${encodeURIComponent(upJson.fileName)}`;
      }

      const res = await apiFetch('/api/student/tasks', {
        method: 'POST',
        body: JSON.stringify({
          mabaitap: submitTarget.mabaitap,
          noidungnop: submitText.trim() || null,
          filenop,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nộp bài thất bại.');
      setSubmitSuccess(json.message || 'Nộp bài thành công!');
      await fetchAssignments();
    } catch (err: any) {
      setSubmitError(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = assignments.filter((item) => {
    const matchSearch = item.tieude.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (item.phancong?.monhoc?.tenmon ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (activeTab === "Chưa làm") {
      return !item.nopbai;
    }
    if (activeTab === "Đã nộp") {
      return !!item.nopbai;
    }
    return true;
  });

  if (authLoading || !user) return null;

  return (
    <DashboardShell pageTitle="Bài tập">
        <div className="p-4 sm:p-8 bg-[#FAF7F6] min-h-screen font-sans">
        {/* Header */}
        <div className="mb-6 sm:mb-10 flex flex-wrap justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Bài tập</h1>
                <p className="text-gray-400 text-sm mt-1">Danh sách bài tập và đồ án cần hoàn thành</p>
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex bg-gray-200/50 p-1 rounded-2xl w-full md:w-auto">
            {["Tất cả", "Chưa làm", "Đã nộp"].map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab
                    ? "bg-[#6B7280] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
                >
                {tab}
                </button>
            ))}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
                <input
                type="text"
                placeholder="Tìm kiếm bài tập..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 ring-red-100 outline-none transition-all shadow-sm"
                />
                <Search
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
                />
            </div>
            </div>
        </div>

        {/* List */}
        {loading ? (
            <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
                <Loader2 size={32} className="animate-spin text-red-500" />
                <p className="text-sm font-bold">Đang tải danh sách bài tập...</p>
            </div>
        ) : filtered.length === 0 ? (
            <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                <FileText className="mx-auto mb-4 text-gray-200" size={64} />
                <p className="text-gray-400 font-bold text-lg">Không tìm thấy bài tập nào</p>
            </div>
        ) : (
            <div className="space-y-6">
                {filtered.map((item) => {
                const config = LOAI_CONFIG[item.loai] || LOAI_CONFIG.Baitap;
                const Icon = config.icon;
                return (
                    <div
                        key={item.mabaitap}
                        className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-6 sm:gap-8 hover:shadow-lg transition-all duration-300 group"
                    >
                        {/* Icon Section */}
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${config.color} group-hover:scale-110 transition-transform`}
                        >
                            <Icon size={32} />
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 w-full lg:w-auto text-center lg:text-left">
                            <h3 className="text-lg font-black text-gray-900 mb-1 break-words">
                                {item.tieude}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                                {item.mota || "Không có mô tả chi tiết."}
                            </p>
                            <span
                                className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}
                            >
                                {item.phancong?.monhoc?.tenmon ?? "Môn học tự do"}
                            </span>
                        </div>

                        {/* Meta Section */}
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 text-left sm:text-center lg:text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                    Hạn nộp
                                </p>
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    {new Date(item.hannop) < new Date() ? (
                                        <>
                                            <Calendar size={14} className="text-red-500 shrink-0" />
                                            <span className="text-red-500">{formatDate(item.hannop)}</span>
                                            <span className="text-[10px] bg-red-100 text-red-500 rounded-full px-2 py-0.5 font-black">Hết hạn</span>
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={14} className="text-red-400 shrink-0" />
                                            <span className="text-gray-700">{formatDate(item.hannop)}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                                    Giảng viên
                                </p>
                                <p className="text-sm font-black text-gray-700">
                                    {item.phancong?.giangvien?.hoten ?? "Hệ thống"}
                                </p>
                            </div>
                        </div>

                        {/* Buttons Section */}
                        <div className="flex flex-col gap-2 w-full lg:w-52 shrink-0">
                            {item.nopbai ? (
                                <button
                                    onClick={() => { setDetailTarget(item); setShowDetailModal(true); }}
                                    className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold border border-green-200/50 w-full hover:bg-green-100 transition-all"
                                >
                                    <CheckCircle size={14} className="shrink-0 text-green-500" />
                                    Xem bài đã nộp {item.nopbai.diem !== null ? `— ${item.nopbai.diem}đ` : ""}
                                </button>
                            ) : null}
                            {/* Nộp bài */}
                            <button
                                onClick={() => openSubmitModal(item)}
                                className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-md w-full ${
                                  item.nopbai
                                    ? 'bg-[#FFF4F4] text-[#C0392B] border border-[#F2A8A8] hover:bg-[#FFE0E0]'
                                    : 'bg-[#E57373] text-white hover:bg-[#C0392B] shadow-[#F2A8A8]/60'
                                }`}
                            >
                                <Upload size={16} />
                                {item.nopbai ? 'Nộp lại' : 'Nộp bài'}
                            </button>
                            {/* Xem đề bài */}
                            <button
                                onClick={() => {
                                    setSelectedAssignment(item);
                                    setShowModal(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-white text-[#6B4F43] border border-[#EAD9CB] py-3 rounded-2xl text-sm font-bold hover:bg-[#FFF4F0] transition-all w-full"
                            >
                                <Eye size={16} />
                                Xem đề bài
                            </button>
                        </div>
                    </div>
                );
                })}
            </div>
        )}
        </div>

        {/* Assignment Viewer Modal */}
        {showModal && selectedAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start shrink-0 bg-gray-50/20">
                        <div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-600">
                                {selectedAssignment.phancong?.monhoc?.tenmon ?? "Bài tập tự do"}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 mt-2">
                                {selectedAssignment.tieude}
                            </h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Giảng viên: <strong className="text-gray-700">{selectedAssignment.phancong?.giangvien?.hoten ?? "Hệ thống"}</strong> | Hạn nộp: <strong className="text-red-500">{formatDate(selectedAssignment.hannop)}</strong>
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setSelectedAssignment(null);
                            }}
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
                        <div>
                            <h4 className="text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
                                Mô tả đề bài
                            </h4>
                            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                {selectedAssignment.mota || "Không có mô tả chi tiết."}
                            </p>
                        </div>

                        {/* File đề bài đính kèm */}
                        <div>
                            <h4 className="text-xs text-gray-400 uppercase font-black tracking-widest mb-3">
                                Tài liệu đính kèm
                            </h4>
                            {selectedAssignment.filedinh ? (() => {
                                const fileUrl = resolveFileUrl(selectedAssignment.filedinh);
                                const fileName = decodeURIComponent(selectedAssignment.filedinh.split('/').pop()?.split('?').shift() ?? "tai-lieu-dinh-kem");
                                const lowerUrl = fileUrl.toLowerCase().split('?').shift() ?? "";
                                const isPdf = lowerUrl.endsWith('.pdf');
                                const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(ext => lowerUrl.endsWith(ext));
                                const isDoc = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'].some(ext => lowerUrl.endsWith(ext));

                                return (
                                    <div className="space-y-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 gap-4">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <FileText className="text-red-500 shrink-0" size={24} />
                                                <div className="truncate">
                                                    <p className="text-sm font-black text-gray-900 truncate max-w-xs md:max-w-md" title={fileName}>
                                                        {fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-400">Tài liệu học phần</p>
                                                </div>
                                            </div>
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-md"
                                            >
                                                Mở trong tab mới
                                            </a>
                                        </div>

                                        {/* Inline PDF / Image / Doc Previewer */}
                                        {isPdf ? (
                                            <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                                                <iframe
                                                    src={`${fileUrl}#toolbar=0`}
                                                    className="w-full h-[450px] border-none"
                                                    title="Assignment PDF Viewer"
                                                />
                                            </div>
                                        ) : isImage ? (
                                            <div className="border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 flex justify-center">
                                                <img
                                                    src={fileUrl}
                                                    alt="Attached Assignment Material"
                                                    className="max-h-[400px] object-contain rounded-xl shadow-md"
                                                />
                                            </div>
                                        ) : isDoc ? (
                                            <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                                                <iframe
                                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                                                    className="w-full h-[500px] border-none"
                                                    title="Assignment Document Viewer"
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed text-gray-400">
                                                <p className="text-sm font-medium italic">Không hỗ trợ xem trước trực tiếp định dạng file này. Vui lòng bấm "Mở trong tab mới" để xem và tải về.</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })() : (
                                <p className="text-sm text-gray-400 italic">Bài tập này không đính kèm file tài liệu.</p>
                            )}
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50/50">
                        <button
                            onClick={() => {
                                setShowModal(false);
                                setSelectedAssignment(null);
                            }}
                            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Đóng lại
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ═══ Submit Modal ══════════════════════════════════════════════════════════ */}
        {showSubmitModal && submitTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0 bg-[#FFF8F6]">
                        <div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFE0E0] text-[#C0392B]">
                                {submitTarget.phancong?.monhoc?.tenmon ?? 'Bài tập'}
                            </span>
                            <h2 className="text-lg font-black text-gray-900 mt-2 leading-tight">
                                {submitTarget.tieude}
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                Hạn nộp: <strong className="text-[#C0392B]">
                                    {new Date(submitTarget.hannop).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </strong>
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowSubmitModal(false); setSubmitTarget(null); }}
                            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-5">
                        {/* Status badge nếu đã nộp */}
                        {submitTarget.nopbai && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200/60">
                                <CheckCircle size={16} className="text-green-500 shrink-0" />
                                <div className="text-xs text-green-700">
                                    <strong>Đã nộp lần trước</strong> — {new Date(submitTarget.nopbai.thoigiannop).toLocaleString('vi-VN')}
                                    {submitTarget.nopbai.diem !== null && <span> — Điểm: <strong>{submitTarget.nopbai.diem}</strong></span>}
                                    {submitTarget.nopbai.nhanxet && <p className="mt-0.5 text-green-600 italic">{submitTarget.nopbai.nhanxet}</p>}
                                </div>
                            </div>
                        )}

                        {/* Nội dung trả lời */}
                        <div>
                            <label className="block text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
                                Nội dung bài làm
                            </label>
                            <textarea
                                rows={5}
                                value={submitText}
                                onChange={(e) => setSubmitText(e.target.value)}
                                placeholder="Nhập câu trả lời, ghi chú hoặc mô tả bài làm của bạn..."
                                className="w-full p-4 rounded-2xl border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-[#F2A8A8] outline-none resize-none bg-gray-50/50 leading-relaxed"
                            />
                        </div>

                        {/* File đính kèm */}
                        <div>
                            <label className="block text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
                                File bài nộp (tùy chọn)
                            </label>
                            <input
                                ref={submitFileRef}
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
                                onChange={(e) => setSubmitFile(e.target.files?.[0] ?? null)}
                            />
                            <div
                                onClick={() => submitFileRef.current?.click()}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#F2A8A8] hover:bg-[#FFF8F6] cursor-pointer transition-all"
                            >
                                <Paperclip size={18} className="text-[#E57373] shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {submitFile ? (
                                        <p className="text-sm font-bold text-gray-800 truncate">{submitFile.name}</p>
                                    ) : submitFileUrl ? (
                                        <p className="text-sm text-gray-500 truncate">
                                            File hiện tại:{" "}
                                            <a
                                                href={resolveFileUrl(submitFileUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-gray-700 hover:text-red-500 underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {decodeURIComponent(submitFileUrl.split('?name=').pop() ?? 'file')}
                                            </a>
                                        </p>
                                    ) : (
                                        <p className="text-sm text-gray-400">Nhấn để chọn file đính kèm</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-0.5">PDF, Word, Excel, ảnh, ZIP... tối đa 20MB</p>
                                </div>
                                {submitFile && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSubmitFile(null); }}
                                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Errors / Success */}
                        {submitError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200/60 text-xs text-red-600">
                                <X size={14} className="shrink-0" />
                                {submitError}
                            </div>
                        )}
                        {submitSuccess && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200/60 text-xs text-green-700">
                                <CheckCircle size={14} className="shrink-0" />
                                {submitSuccess}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-gray-100 flex justify-between gap-3 shrink-0 bg-gray-50/50">
                        <button
                            onClick={() => { setShowSubmitModal(false); setSubmitTarget(null); }}
                            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmitAssignment}
                            disabled={isSubmitting || (!submitText.trim() && !submitFile && !submitFileUrl)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#E57373] hover:bg-[#C0392B] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-[#F2A8A8]/40"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {isSubmitting ? 'Đang nộp...' : submitTarget.nopbai ? 'Nộp lại bài' : 'Nộp bài'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ═══ Submission Detail Modal ═══════════════════════════════════════════ */}
        {showDetailModal && detailTarget?.nopbai && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0 bg-gray-50/20">
                        <div>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                                Bài đã nộp
                            </span>
                            <h2 className="text-xl font-black text-gray-900 mt-2">{detailTarget.tieude}</h2>
                            <p className="text-gray-400 text-xs mt-1">
                                Nộp lúc: <strong className="text-gray-700">{formatDate(detailTarget.nopbai.thoigiannop)}</strong>
                                {detailTarget.nopbai.trenop && <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black">Trễ hạn</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowDetailModal(false); setDetailTarget(null); }}
                            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
                        >✕</button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-5">
                        {/* Score & Feedback */}
                        {detailTarget.nopbai.diem !== null && (
                            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200/60">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-yellow-600">{detailTarget.nopbai.diem}</p>
                                    <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Điểm</p>
                                </div>
                                {detailTarget.nopbai.nhanxet && (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Nhận xét của giảng viên</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{detailTarget.nopbai.nhanxet}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Nội dung nộp */}
                        {detailTarget.nopbai.noidungnop && (
                            <div>
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Nội dung bài nộp</p>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {detailTarget.nopbai.noidungnop}
                                </div>
                            </div>
                        )}

                        {/* File nộp */}
                        {detailTarget.nopbai.filenop && (() => {
                            const rawUrl = detailTarget.nopbai!.filenop!;
                            const fileUrl = resolveFileUrl(rawUrl.split('?name=')[0]);
                            const fileName = decodeURIComponent(rawUrl.split('?name=').pop() ?? rawUrl.split('/').pop() ?? 'file');
                            const lower = fileUrl.toLowerCase().split('?')[0];
                            const isPdf = lower.endsWith('.pdf');
                            const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(e => lower.endsWith(e));
                            const isDoc = ['.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'].some(e => lower.endsWith(e));
                            return (
                                <div className="space-y-3">
                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">File đính kèm</p>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <FileText className="text-blue-500 shrink-0" size={22} />
                                            <p className="text-sm font-bold text-gray-800 truncate" title={fileName}>{fileName}</p>
                                        </div>
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0">
                                            Tải về
                                        </a>
                                    </div>
                                    {isPdf ? (
                                        <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                                            <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-[400px] border-none" title="Submitted PDF" />
                                        </div>
                                    ) : isImage ? (
                                        <div className="border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 flex justify-center">
                                            <img src={fileUrl} alt="Submitted File" className="max-h-[350px] object-contain rounded-xl shadow-md" />
                                        </div>
                                    ) : isDoc ? (
                                        <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                                            <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                                                className="w-full h-[450px] border-none" title="Submitted Document" />
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })()}

                        {!detailTarget.nopbai.noidungnop && !detailTarget.nopbai.filenop && (
                            <p className="text-sm text-gray-400 italic text-center py-6">Bài nộp không có nội dung hay file đính kèm.</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
                        <button
                            onClick={() => { setShowDetailModal(false); setDetailTarget(null); }}
                            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                        >Đóng lại</button>
                    </div>
                </div>
            </div>
        )}
    </DashboardShell>
  );
}