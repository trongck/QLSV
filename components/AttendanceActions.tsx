"use client";
import { useState } from "react";
import { QrCode, ScanFace, ChevronRight } from "lucide-react"; // Cài lucide-react

// Cấu trúc dữ liệu cho các môn học
interface Subject {
  id: string;
  name: string;
  time: string;
  room: string;
}

const mockSubjects: Subject[] = [
  { id: "GT01023", name: "Toán cao cấp 1", time: "07:05:22", room: "A203" },
  { id: "KN01001", name: "Lập trình cơ bản", time: "09:10:15", room: "B101" },
  { id: "KQ01211", name: "Tiếng Anh 2", time: "11:02:01", room: "C202" },
];

export default function AttendanceActions() {
  const [filter, setFilter] = useState<"month" | "semester">("month");

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Tiêu đề và Nút hành động */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nhật ký điểm danh
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Xem lại lịch sử chuyên cần của từng môn học
          </p>
        </div>

        {/* Nút Điểm danh (Màu đỏ, bo tròn) */}
        <button className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-full shadow-lg shadow-red-100 transition-all active:scale-95">
          <QrCode size={20} />
          <ScanFace size={20} />
          <span className="font-semibold text-sm">
            Điểm danh: QR / Khuôn mặt
          </span>
        </button>
      </div>

      {/* 2. Thẻ môn học đang chọn và Bộ lọc */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Thẻ môn học (Nền hồng nhạt) */}
        <div className="md:col-span-2 bg-red-50 p-6 rounded-3xl flex justify-between items-center border border-red-100">
          <div className="flex items-center gap-4">
            {/* Badge ngày tháng */}
            <div className="bg-white p-4 rounded-xl text-center shadow-sm">
              <span className="text-xl font-bold text-gray-800">10</span>
              <span className="text-xs text-gray-400 block mt-1 uppercase font-semibold">
                T05
              </span>
            </div>
            {/* Thông tin môn */}
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Toán cao cấp 1: Xác thực [XÁC THỰC: THÀNH CÔNG (GPS)]
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                📅 07:05:22 | 📍 A203
              </p>
            </div>
          </div>
          <ChevronRight size={24} className="text-red-500" />
        </div>

        {/* Bộ lọc (Pill button) */}
        <div className="bg-gray-100/50 p-2 rounded-full flex gap-1 border">
          <button
            onClick={() => setFilter("month")}
            className={`flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition ${
              filter === "month"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setFilter("semester")}
            className={`flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition ${
              filter === "semester"
                ? "bg-red-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            Học kỳ này
          </button>
        </div>
      </div>
    </div>
  );
}
