"use client";

import React, { useState } from "react";
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
} from "lucide-react";

// --- Dữ liệu mẫu khớp với thiết kế mới ---
const assignments = [
  {
    id: "1",
    title: "Bài tập về nhà: Chương 3 - Hàm số",
    desc: "Giải các bài tập từ 1 đến 10 trang 45 trong sách giáo khoa.",
    subject: "Toán cao cấp",
    deadline: "08/05/2026 23:59",
    status: "Đang làm",
    type: "homework",
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "2",
    title: "Bài tập thực hành: Excel cơ bản",
    desc: "Thực hành các hàm SUM, AVERAGE, COUNT.",
    subject: "Tin học văn phòng",
    deadline: "07/05/2026 23:59",
    status: "Đang làm",
    type: "practice",
    color: "bg-green-100 text-green-600",
  },
  {
    id: "3",
    title: "Bài tập nhóm: Marketing căn bản",
    desc: "Thảo luận và nộp báo cáo nhóm về chiến lược marketing.",
    subject: "Marketing căn bản",
    deadline: "10/05/2026 23:59",
    status: "Đang làm",
    type: "group",
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "4",
    title: "Bài tập trắc nghiệm: Lịch sử Đảng",
    desc: "Hoàn thành bài trắc nghiệm chương 2.",
    subject: "Lịch sử Đảng Cộng sản Việt Nam",
    deadline: "05/05/2026 23:59",
    status: "Đã nộp",
    type: "quiz",
    color: "bg-red-100 text-red-600",
  },
];

export default function AssignmentPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  return (
    <div className="p-8 bg-[#FAF7F6] min-h-screen font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Bài tập</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex bg-gray-200/50 p-1 rounded-2xl w-full md:w-auto">
          {["Tất cả", "Chưa làm", "Đang làm", "Đã nộp"].map((tab) => (
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
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 ring-red-100 outline-none transition-all"
            />
            <Search
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:shadow-sm">
            <Filter size={18} />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {assignments.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-all duration-300"
          >
            {/* Icon Section */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}
            >
              {item.type === "homework" && <BookOpen size={28} />}
              {item.type === "practice" && <BarChart2 size={28} />}
              {item.type === "group" && <Users size={28} />}
              {item.type === "quiz" && <FileText size={28} />}
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                {item.desc}
              </p>
              <span
                className={`px-4 py-1 rounded-full text-xs font-bold ${item.color}`}
              >
                {item.subject}
              </span>
            </div>

            {/* Meta Section */}
            <div className="grid grid-cols-2 md:flex md:gap-16 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  Hạn nộp
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-700 font-bold">
                  <Calendar size={14} />
                  {item.deadline}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  Trạng thái
                </p>
                <p
                  className={`text-sm font-black ${item.status === "Đã nộp" ? "text-green-600" : "text-[#94A3B8]"}`}
                >
                  {item.status}
                </p>
              </div>
            </div>

            {/* Buttons Section */}
            <div className="flex flex-col gap-2 w-full md:w-48">
              {item.status === "Đã nộp" ? (
                <button className="flex items-center justify-center gap-2 bg-[#334155] text-white py-3 rounded-xl text-sm font-bold hover:bg-black transition-all">
                  <Edit3 size={16} />
                  Sửa bài nộp
                </button>
              ) : (
                <>
                  <button className="flex items-center justify-center gap-2 bg-[#64748B] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all">
                    <BookOpen size={16} />
                    Làm bài
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-[#22C55E] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-md shadow-green-100">
                    <Play size={16} className="rotate-90" />
                    Nộp bài
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
