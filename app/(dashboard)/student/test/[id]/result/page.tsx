"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Clock,
  Award
} from "lucide-react";
import { apiFetch } from "@/services/service/auth/auth.service";

export default function ExamResultDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  const fetchResultDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/sinhvien/exam/${id}/result`);
      const json = await res.json();
      if (json.success) {
        setResultData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch result detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResultDetail();
  }, [fetchResultDetail]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy dữ liệu</h2>
          <button onClick={() => router.back()} className="text-red-600 font-bold">Quay lại</button>
        </div>
      </div>
    );
  }

  const { ketqua, details } = resultData;

  return (
    <div className="min-h-screen bg-[#FAF7F6] pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Chi tiết bài làm</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng điểm</span>
                <span className="text-2xl font-black text-red-600 leading-none">{ketqua.diemtong}</span>
             </div>
             <div className="w-px h-8 bg-gray-200 mx-2" />
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Câu đúng</span>
                <span className="text-2xl font-black text-gray-900 leading-none">{ketqua.socandung}/{details.length}</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-5">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
           <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Award size={32} />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Chúc mừng bạn đã hoàn thành!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Bạn đã nộp bài vào lúc <span className="font-bold text-gray-800">{new Date(ketqua.thoigiannopbai).toLocaleString()}</span>. 
              </p>
           </div>
        </div>

        {/* Question List */}
        <div className="space-y-5">
          {details.map((detail: any, index: number) => {
            const { cauhoi, madapan, cautraloituluan, diemdatduoc } = detail;
            const isCorrect = diemdatduoc > 0;
            const isEssay = cauhoi.loaicauhoi === 'TuLuan';

            return (
              <div key={detail.machitiet} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isEssay ? 'bg-blue-50 text-blue-600' : isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {isEssay ? 'Tự luận' : isCorrect ? 'Chính xác' : 'Chưa đúng'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-400">
                      {diemdatduoc} / {cauhoi.diem} điểm
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-4 leading-relaxed whitespace-pre-wrap">
                    {cauhoi.noidung}
                  </h3>

                  {cauhoi.hinhanh && (
                    <img src={cauhoi.hinhanh} alt="Question" className="max-w-full rounded-xl mb-4 border border-gray-100 mx-auto" />
                  )}

                  <div className="space-y-2">
                    {isEssay ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
                        {cautraloituluan || "Không có câu trả lời"}
                      </div>
                    ) : (
                      cauhoi.dapan.map((opt: any) => {
                        const isUserChoice = madapan === opt.madapan;
                        const isCorrectOpt = opt.ladapandung;
                        
                        let bgColor = "bg-white";
                        let borderColor = "border-gray-100";
                        let icon = null;

                        if (isCorrectOpt) {
                          bgColor = "bg-green-50";
                          borderColor = "border-green-200";
                          icon = <CheckCircle2 size={16} className="text-green-600" />;
                        } else if (isUserChoice && !isCorrectOpt) {
                          bgColor = "bg-red-50";
                          borderColor = "border-red-200";
                          icon = <XCircle size={16} className="text-red-600" />;
                        }

                        return (
                          <div 
                            key={opt.madapan}
                            className={`p-3 rounded-xl border-2 flex items-center justify-between transition-all ${bgColor} ${borderColor}`}
                          >
                            <span className={`text-sm ${isUserChoice ? 'font-bold' : 'text-gray-600'}`}>
                              {opt.noidung}
                              {isUserChoice && <span className="ml-2 text-[10px] opacity-50 font-medium">(Bạn chọn)</span>}
                            </span>
                            {icon}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
