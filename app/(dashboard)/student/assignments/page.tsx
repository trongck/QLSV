"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  BookOpen,
  BarChart2,
  Users,
  FileText,
  Calendar,
  Edit3,
  CheckCircle,
  Play,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/service/auth/auth.service";
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
  } | null;
}

const LOAI_CONFIG: Record<string, { icon: any; color: string }> = {
  Baitap: { icon: BookOpen, color: "bg-purple-100 text-purple-600" },
  Thuchanh: { icon: BarChart2, color: "bg-green-100 text-green-600" },
  Nhom: { icon: Users, color: "bg-orange-100 text-orange-600" },
  Tracnghiem: { icon: FileText, color: "bg-red-100 text-red-600" },
  Doan: { icon: BarChart2, color: "bg-blue-100 text-blue-600" },
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

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/sinhvien/assignment");
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
                                <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                                    <Calendar size={14} className="text-red-400" />
                                    {new Date(item.hannop).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                        <div className="flex flex-col gap-2 w-full lg:w-48 shrink-0">
                            {item.nopbai && (
                                <div className="flex items-center justify-center gap-1.5 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold border border-green-200/50 mb-1 w-full">
                                    <CheckCircle size={14} className="shrink-0 text-green-500" />
                                    <span>Đã nộp {item.nopbai.diem !== null ? `(${item.nopbai.diem}đ)` : ""}</span>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedAssignment(item);
                                    setShowModal(true);
                                }}
                                className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-gray-200 w-full"
                            >
                                <FileText size={16} />
                                Xem bài tập
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
                                Giảng viên: <strong className="text-gray-700">{selectedAssignment.phancong?.giangvien?.hoten ?? "Hệ thống"}</strong> | Hạn nộp: <strong className="text-red-500">{new Date(selectedAssignment.hannop).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
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
                            {selectedAssignment.filedinh ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 gap-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="text-red-500 shrink-0" size={24} />
                                            <div className="truncate">
                                                <p className="text-sm font-black text-gray-900 truncate max-w-xs md:max-w-md">
                                                    {selectedAssignment.filedinh.split('/').pop() ?? "tai-lieu-dinh-kem.pdf"}
                                                </p>
                                                <p className="text-xs text-gray-400">Tài liệu học phần</p>
                                            </div>
                                        </div>
                                        <a
                                            href={selectedAssignment.filedinh}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-md"
                                        >
                                            Mở trong tab mới
                                        </a>
                                    </div>

                                    {/* Inline PDF / Image Previewer */}
                                    {selectedAssignment.filedinh.toLowerCase().endsWith('.pdf') ? (
                                        <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                                            <iframe
                                                src={`${selectedAssignment.filedinh}#toolbar=0`}
                                                className="w-full h-[450px] border-none"
                                                title="Assignment PDF Viewer"
                                            />
                                        </div>
                                    ) : (selectedAssignment.filedinh.toLowerCase().endsWith('.png') ||
                                         selectedAssignment.filedinh.toLowerCase().endsWith('.jpg') ||
                                         selectedAssignment.filedinh.toLowerCase().endsWith('.jpeg') ||
                                         selectedAssignment.filedinh.toLowerCase().endsWith('.gif')) ? (
                                        <div className="border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 flex justify-center">
                                            <img
                                                src={selectedAssignment.filedinh}
                                                alt="Attached Assignment Material"
                                                className="max-h-[400px] object-contain rounded-xl shadow-md"
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed text-gray-400">
                                            <p className="text-sm font-medium italic">Không hỗ trợ xem trước trực tiếp định dạng file này. Vui lòng bấm "Mở trong tab mới" để xem và tải về.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
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
                            className="px-6 py-3 bg-gray-200/80 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Đóng lại
                        </button>
                    </div>
                </div>
            </div>
        )}
    </DashboardShell>
  );
}