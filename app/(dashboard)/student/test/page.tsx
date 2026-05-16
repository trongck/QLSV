"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, FileText, Clock, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function ExamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const handleStartExam = (exam: any) => {
    router.push(`/student/test/${exam.madethi}`);
  };

  useEffect(() => {
    async function loadExams() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/sinhvien/exam");
        const json = await res.json();
        if (json.success) {
          setExams(json.data);
        }
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  const getExamStatus = (exam: any) => {
    const now = new Date();
    const start = new Date(exam.thoigianbatdau);
    const end = new Date(exam.thoigianketthuc);

    if (exam.trangthai === "DaLam") return { text: "Đã hoàn thành", color: "bg-green-100 text-green-600", canDo: false };
    if (now < start) return { text: "Sắp diễn ra", color: "bg-blue-100 text-blue-600", canDo: false };
    if (now > end) return { text: "Đã kết thúc", color: "bg-gray-100 text-gray-600", canDo: false };
    return { text: "Đang diễn ra", color: "bg-red-100 text-red-600", canDo: true };
  };

  const filteredExams =
    activeTab === "Tất cả"
      ? exams
      : exams.filter((exam) => exam.trangthai === "DaLam");

  return (
    <DashboardShell pageTitle="Bài thi">
        <div className="p-8 bg-[#FAF7F6] min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Bài thi</h1>

        {/* Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex border-b border-gray-200 w-full md:w-auto">
            {["Tất cả", "Đã kết thúc"].map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 text-sm font-bold transition-all relative ${
                    activeTab === tab
                    ? "text-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                >
                {tab}
                {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600" />
                )}
                </button>
            ))}
            </div>
            {/* Phần Search và Filter giữ nguyên... */}
        </div>

        {/* Danh sách bài thi */}
        {loading ? (
            <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-red-600" size={32} />
            <span className="ml-3 text-gray-500 font-medium">Đang tải danh sách bài thi...</span>
            </div>
        ) : filteredExams.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
            <FileText className="mx-auto mb-3 opacity-20" size={48} />
            <p>Không có bài thi nào được tìm thấy</p>
            </div>
        ) : (
            <div className="space-y-4">
            {filteredExams.map((exam) => {
                const status = getExamStatus(exam);
                return (
                <div
                    key={exam.madethi}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start gap-4 flex-1 w-full">
                    <div className={`p-3 rounded-xl ${status.color}`}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {exam.tieude}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-gray-500 text-sm font-medium">
                            Môn học: {exam.monhoc || "Chưa phân loại"}
                        </span>
                        {exam.matkhau && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 text-[10px] font-bold rounded-full border border-yellow-100">
                            <Search size={10} className="rotate-45" /> Cần mật khẩu
                            </div>
                        )}
                        </div>
                    </div>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-48">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Calendar size={14} /> Bắt đầu lúc
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                        {new Date(exam.thoigianbatdau).toLocaleString("vi-VN", {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        })}
                    </span>
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-40">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                        <Clock size={14} /> Thời lượng
                    </div>
                    <span className="text-sm font-bold text-gray-800">
                        {exam.thoigianlam} phút
                    </span>
                    </div>

                    <div className="flex flex-col items-center justify-center w-full md:w-40">
                    <div className={`px-4 py-2 rounded-lg text-center w-full ${status.color} border border-current opacity-80`}>
                        <p className="text-[10px] uppercase font-black tracking-wider">
                            {status.text}
                        </p>
                    </div>
                    </div>

                    <div className="w-full md:w-40">
                    {exam.trangthai === "DaLam" ? (
                        <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => setSelectedResult(exam)}
                            className="w-full py-3 px-4 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Xem kết quả
                        </button>
                        <button 
                            onClick={() => router.push(`/student/test/${exam.madethi}/result`)}
                            className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-100"
                        >
                            Xem chi tiết
                        </button>
                        </div>
                    ) : status.canDo ? (
                        <button 
                        onClick={() => handleStartExam(exam)}
                        className="w-full py-3 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                        >
                        Vào làm bài
                        </button>
                    ) : (
                        <button disabled className="w-full py-3 px-4 bg-gray-50 text-gray-400 rounded-xl text-sm font-bold cursor-not-allowed border border-gray-100">
                        Chưa đến giờ
                        </button>
                    )}
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* Result Modal */}
        {selectedResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Kết quả bài thi</h2>
                <p className="text-gray-500 mb-8 font-medium">{selectedResult.tieude}</p>
                
                <div className="bg-[#FAF7F6] rounded-2xl p-6 mb-8 grid grid-cols-2 gap-4">
                <div className="text-center">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Điểm số</p>
                    <p className="text-4xl font-black text-red-600">{selectedResult.diemtong ?? 0}</p>
                </div>
                <div className="text-center border-l border-gray-200">
                    <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Câu đúng</p>
                    <p className="text-4xl font-black text-gray-900">{selectedResult.socandung ?? 0}</p>
                </div>
                </div>

                <button 
                onClick={() => setSelectedResult(null)}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all"
                >
                Đóng
                </button>
            </div>
            </div>
        )}
        </div>
    </DashboardShell>
  );
}
