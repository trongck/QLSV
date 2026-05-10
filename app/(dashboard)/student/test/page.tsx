"use client";

import React, { useState } from "react";
import { Search, Filter, FileText, Clock, Calendar } from "lucide-react";

// Dữ liệu mẫu (Đã cập nhật trạng thái)
const exams = [
  {
    id: "1",
    title: "Toán cao cấp 1_KTGK",
    type: "Trắc nghiệm",
    questions: 30,
    startTime: "05/05/2026 08:00",
    duration: "60 phút",
    status: "Chưa làm", // Thay đổi từ "Sắp diễn ra" thành "Chưa làm"
    color: "bg-red-100 text-red-600",
  },
  {
    id: "5",
    title: "Excel cơ bản_KTGK",
    type: "Trắc nghiệm",
    questions: 25,
    startTime: "01/05/2026 08:00",
    duration: "45 phút",
    status: "Đã kết thúc",
    timeRemaining: "Đã nộp bài",
    color: "bg-gray-100 text-gray-600",
  },
];

export default function ExamPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  const filteredExams =
    activeTab === "Tất cả"
      ? exams
      : exams.filter((exam) => exam.status === "Đã kết thúc");

  return (
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
      <div className="space-y-4">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6"
          >
            <div className="flex items-start gap-4 flex-1 w-full">
              <div className={`p-3 rounded-xl ${exam.color}`}>
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                  {exam.title}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Hình thức: {exam.type}
                </p>
                <p className="text-gray-500 text-sm">
                  Số câu hỏi: {exam.questions} câu
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-48">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Calendar size={14} /> Thời gian bắt đầu
              </div>
              <span className="text-sm font-bold text-gray-800">
                {exam.startTime}
              </span>
            </div>

            <div className="flex flex-col gap-1 w-full md:w-40">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Clock size={14} /> Thời gian làm bài
              </div>
              <span className="text-sm font-bold text-gray-800">
                {exam.duration}
              </span>
            </div>

            {/* PHẦN ĐÃ CHỈNH SỬA: Bỏ cột hiển thị "Sắp diễn ra" ở giữa */}
            <div className="flex flex-col items-center justify-center w-full md:w-40">
              {exam.status === "Đã kết thúc" && (
                <div className="bg-gray-50 text-gray-500 p-2 rounded-lg text-center w-full">
                  <p className="text-[10px] uppercase font-bold opacity-70">
                    Đã kết thúc
                  </p>
                  <p className="text-xs font-bold">{exam.timeRemaining}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-40">
              {exam.status === "Đã kết thúc" ? (
                <button className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                  Xem kết quả
                </button>
              ) : (
                <button className="w-full py-3 px-4 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
                  Làm bài
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
