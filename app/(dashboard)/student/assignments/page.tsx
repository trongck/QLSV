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
        <div className="p-8 bg-[#FAF7F6] min-h-screen font-sans">
        {/* Header */}
        <div className="mb-10 flex justify-between items-center">
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
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-all duration-300 group"
                    >
                        {/* Icon Section */}
                        <div
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${config.color} group-hover:scale-110 transition-transform`}
                        >
                            <Icon size={32} />
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-black text-gray-900 mb-1">
                                {item.tieude}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                                {item.mota || "Không có mô tả chi tiết."}
                            </p>
                            <span
                                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}
                            >
                                {item.phancong?.monhoc?.tenmon ?? "Môn học tự do"}
                            </span>
                        </div>

                        {/* Meta Section */}
                        <div className="grid grid-cols-2 md:flex md:gap-16 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
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
                        <div className="flex flex-col gap-2 w-full md:w-48">
                            {item.nopbai ? (
                                <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3.5 rounded-2xl text-sm font-bold border border-green-200">
                                    <CheckCircle size={16} />
                                    Đã nộp bài {item.nopbai.diem !== null ? `(${item.nopbai.diem}đ)` : ""}
                                </div>
                            ) : (
                                <button className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-100">
                                    <Play size={16} className="rotate-90" />
                                    Làm bài ngay
                                </button>
                            )}
                        </div>
                    </div>
                );
                })}
            </div>
        )}
        </div>
    </DashboardShell>
  );
}