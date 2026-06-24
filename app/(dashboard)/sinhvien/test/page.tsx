"use client";

import React, { useState, Suspense } from "react";
import { FileText, Clock, Calendar, Loader2, CheckCircle2, Timer, ShieldAlert, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentExams, Exam } from "@/hooks/sinhvien/useStudentExams";
import { ExamSessionView } from "@/components/student/exam/ExamSessionView";
import { ExamResultView } from "@/components/student/exam/ExamResultView";

export default function ExamPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" size={48} /></div>}>
      <ExamPage />
    </Suspense>
  );
}

function ExamPage() {
  const searchParams = useSearchParams();
  const examIdParam = searchParams.get("examId");
  const view = searchParams.get("view");

  if (examIdParam) {
    const examId = parseInt(examIdParam, 10);
    if (view === "result") return <ExamResultView examId={examId} />;
    return <ExamSessionView examId={examId} />;
  }

  return <ExamList />;
}

// ─── Status helper ────────────────────────────────────────────────────────────
function getExamStatus(exam: Exam & { ketquatrangthai?: string }) {
  const now = new Date();
  const start = new Date(exam.thoigianbatdau);
  const end = new Date(exam.thoigianketthuc);

  // Ưu tiên trạng thái từ ketquathi của SV
  if (exam.ketquatrangthai === "DaNop") {
    return { text: "Đã nộp", color: "text-green-600", bg: "bg-green-50", border: "border-green-100", icon: <CheckCircle2 size={20} />, canDo: false, action: "result" };
  }
  if (exam.ketquatrangthai === "ViPham") {
    return { text: "Vi phạm", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: <ShieldAlert size={20} />, canDo: false, action: null };
  }
  if (exam.ketquatrangthai === "HetGio") {
    return { text: "Hết giờ", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", icon: <XCircle size={20} />, canDo: false, action: "result" };
  }
  if (exam.trangthai === "DaLam") {
    return { text: "Đã hoàn thành", color: "text-green-600", bg: "bg-green-50", border: "border-green-100", icon: <CheckCircle2 size={20} />, canDo: false, action: "result" };
  }

  // Theo thời gian
  if (now < start) {
    return { text: "Chưa đến giờ", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", icon: <Calendar size={20} />, canDo: false, action: null };
  }
  if (now > end) {
    return { text: "Đã kết thúc", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-100", icon: <XCircle size={20} />, canDo: false, action: null };
  }
  // Đang diễn ra
  return { text: "Đang diễn ra", color: "text-red-600", bg: "bg-red-50", border: "border-red-100", icon: <FileText size={20} />, canDo: true, action: "exam" };
}

// ─── ExamList ─────────────────────────────────────────────────────────────────
function ExamList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Tất cả");
  const { exams, loading } = useStudentExams();
  const [selectedResult, setSelectedResult] = useState<Exam | null>(null);

  const handleStartExam = (exam: Exam) => {
    router.push(`/sinhvien/test?examId=${exam.madethi}`);
  };

  const handleViewResult = (exam: Exam) => {
    router.push(`/sinhvien/test?examId=${exam.madethi}&view=result`);
  };

  const filteredExams =
    activeTab === "Tất cả"
      ? exams
      : exams.filter((exam) => {
          const now = new Date();
          const end = new Date(exam.thoigianketthuc);
          const isDaNop = (exam as any).ketquatrangthai === "DaNop" || (exam as any).ketquatrangthai === "HetGio" || (exam as any).ketquatrangthai === "ViPham";
          return isDaNop || exam.trangthai === "DaLam" || now > end;
        });

  return (
    <DashboardShell pageTitle="Bài thi">
      <div className="p-4 sm:p-6 md:p-8 bg-[#FAF7F6] min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Bài thi</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 w-full mb-6 sm:mb-8 overflow-x-auto">
          {["Tất cả", "Đã kết thúc"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 sm:px-6 py-2.5 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab ? "text-red-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600" />}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-red-600" size={32} />
            <span className="ml-3 text-gray-500 font-medium">Đang tải danh sách bài thi...</span>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
            <FileText className="mx-auto mb-3 opacity-20" size={48} />
            <p>Không có bài thi nào được tìm thấy</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredExams.map((exam) => {
              const status = getExamStatus(exam as any);
              return (
                <div
                  key={exam.madethi}
                  className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow ${status.border}`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Icon + Info */}
                    <div className={`p-3 rounded-xl ${status.bg} ${status.color} flex-shrink-0`}>
                      {status.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight truncate">{exam.tieude}</h3>
                      <p className="text-gray-500 text-sm mt-0.5 truncate">Môn: {exam.monhoc || "Chưa phân loại"}</p>
                    </div>

                    {/* Time info — responsive grid on mobile */}
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 sm:gap-6 w-full sm:w-auto text-xs sm:text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-gray-400 font-medium mb-0.5">
                          <Calendar size={12} /> Bắt đầu
                        </div>
                        <span className="font-bold text-gray-700 text-xs sm:text-sm">
                          {new Date(exam.thoigianbatdau).toLocaleString("vi-VN", {
                            hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
                          })}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-gray-400 font-medium mb-0.5">
                          <Clock size={12} /> Thời lượng
                        </div>
                        <span className="font-bold text-gray-700">{exam.thoigianlam} phút</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${status.bg} ${status.color} flex-shrink-0`}>
                      {status.text}
                    </div>

                    {/* Action button */}
                    <div className="w-full sm:w-36 flex-shrink-0">
                      {status.action === "result" || exam.trangthai === "DaLam" ? (
                        <div className="flex flex-row sm:flex-col gap-2">
                          <button
                            onClick={() => setSelectedResult(exam)}
                            className="flex-1 py-2.5 px-3 bg-white text-gray-900 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                          >
                            Xem điểm
                          </button>
                          <button
                            onClick={() => handleViewResult(exam)}
                            className="flex-1 py-2.5 px-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
                          >
                            Chi tiết
                          </button>
                        </div>
                      ) : status.canDo ? (
                        <button
                          onClick={() => handleStartExam(exam)}
                          className="w-full py-2.5 px-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                        >
                          Vào làm bài
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-3 bg-gray-50 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed border border-gray-100 truncate"
                        >
                          {status.text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick result modal */}
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
                  <p className="text-4xl font-black text-red-600">{(selectedResult as any).diemtong ?? 0}</p>
                </div>
                <div className="text-center border-l border-gray-200">
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1 tracking-widest">Câu đúng</p>
                  <p className="text-4xl font-black text-gray-900">{(selectedResult as any).socandung ?? 0}</p>
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
