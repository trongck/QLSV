"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Save,
  FileText,
  Tag,
  Calendar,
  Clock,
  MoreVertical,
  Star,
} from "lucide-react";

// 1. DỮ LIỆU MẪU NHẬT KÝ
const initialNotes = [
  {
    id: 1,
    title: "Ghi chú ôn tập Cơ sở dữ liệu",
    content:
      "Cần tập trung vào phần Normalization (1NF, 2NF, 3NF) và cách tối ưu hóa câu lệnh JOIN. Thầy Nam có nhắc kỹ phần Indexing.",
    date: "08/05/2026",
    time: "14:30",
    category: "Học tập",
    color: "bg-red-500",
    isFavorite: true,
  },
  {
    id: 2,
    title: "Ý tưởng đồ án Smart Study",
    content:
      "Sử dụng Next.js cho Frontend và Node.js cho Backend. Tích hợp thêm tính năng thông báo qua Telegram cho sinh viên.",
    date: "05/05/2026",
    time: "09:00",
    category: "Dự án",
    color: "bg-blue-500",
    isFavorite: false,
  },
  {
    id: 3,
    title: "Lịch họp nhóm tuần sau",
    content:
      "Họp vào sáng thứ 2 tại thư viện. Thảo luận về thiết kế Database trên SQLyog.",
    date: "04/05/2026",
    time: "20:15",
    category: "Việc cần làm",
    color: "bg-yellow-500",
    isFavorite: false,
  },
];

export default function StudentNotePage() {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Hàm cập nhật nội dung ghi chú
  const updateNote = (field: string, value: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n)),
    );
  };

  // Hàm thêm ghi chú mới
  const addNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "Ghi chú mới",
      content: "",
      date: new Date().toLocaleDateString("vi-VN"),
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      category: "Chưa phân loại",
      color: "bg-gray-400",
      isFavorite: false,
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  return (
    <div className="flex h-full bg-[#FDF8F6] overflow-hidden">
      {/* --- CỘT 1: DANH SÁCH GHI CHÚ --- */}
      <div className="w-[380px] flex flex-col bg-white border-r border-gray-100 shadow-sm">
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-800">Nhật ký học tập</h1>
            <button
              onClick={addNewNote}
              className="p-2 bg-[#E57373] text-white rounded-lg hover:bg-[#d32f2f] transition shadow-md active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm kiếm ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {notes
            .filter((n) =>
              n.title.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`p-5 cursor-pointer border-b border-gray-50 transition-all ${
                  selectedNoteId === note.id
                    ? "bg-red-50 border-r-4 border-red-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${note.color}`}
                  >
                    {note.category}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} /> {note.date}
                  </span>
                </div>
                <h3
                  className={`font-bold text-sm mb-1 truncate ${selectedNoteId === note.id ? "text-red-700" : "text-gray-800"}`}
                >
                  {note.title || "Không có tiêu đề"}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {note.content || "Chưa có nội dung..."}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* --- CỘT 2: TRÌNH SOẠN THẢO GHI CHÚ --- */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header Công cụ */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-red-500 transition">
              <Save size={20} />
            </button>
            <button className="hover:text-red-500 transition">
              <Tag size={20} />
            </button>
            <button className="hover:text-yellow-500 transition">
              <Star size={20} />
            </button>
            <div className="h-6 w-[1px] bg-gray-100 mx-2"></div>
            <button className="hover:text-red-600 transition">
              <Trash2 size={20} />
            </button>
          </div>
          <div className="text-[11px] text-gray-400 font-medium italic">
            Lần cuối chỉnh sửa: {selectedNote.time} - {selectedNote.date}
          </div>
        </div>

        {/* Vùng soạn thảo */}
        <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full">
          <input
            type="text"
            value={selectedNote.title}
            onChange={(e) => updateNote("title", e.target.value)}
            placeholder="Tiêu đề ghi chú..."
            className="w-full text-3xl font-extrabold text-gray-800 border-none focus:ring-0 mb-6 placeholder:text-gray-200"
          />

          <div className="flex items-center gap-6 mb-8 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Calendar size={14} className="text-red-400" />
              <span>Ngày tạo: {selectedNote.date}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
              <Tag size={14} className="text-blue-400" />
              <select
                className="bg-transparent border-none p-0 text-xs focus:ring-0 font-bold text-gray-600 cursor-pointer"
                value={selectedNote.category}
                onChange={(e) => updateNote("category", e.target.value)}
              >
                <option>Học tập</option>
                <option>Dự án</option>
                <option>Việc cần làm</option>
                <option>Cá nhân</option>
              </select>
            </div>
          </div>

          <textarea
            value={selectedNote.content}
            onChange={(e) => updateNote("content", e.target.value)}
            placeholder="Bắt đầu viết nhật ký học tập của bạn tại đây..."
            className="w-full h-full min-h-[500px] border-none focus:ring-0 text-gray-700 leading-loose text-lg resize-none placeholder:text-gray-100"
          />
        </div>
      </div>

      {/* --- CỘT 3: TIỆN ÍCH PHỤ --- */}
      <div className="w-[300px] bg-[#FDF8F6] p-6 border-l border-gray-100 hidden xl:flex flex-col gap-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-50">
          <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-red-500" /> Tóm tắt nhật ký
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tổng số ghi chú:</span>
              <span className="font-bold text-gray-800">{notes.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Tháng này:</span>
              <span className="font-bold text-gray-800">12</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-800">Gợi ý chủ đề</h4>
          <div className="flex flex-wrap gap-2">
            {["#IT", "#Database", "#NextJS", "#Lịch_Học", "#Thi_Cử"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white rounded-full text-[10px] text-gray-500 border border-gray-100 cursor-pointer hover:border-red-200 transition"
                >
                  {tag}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
