"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Info,
  Bell,
  Filter,
} from "lucide-react";

// 1. CẤU HÌNH DỮ LIỆU MÔN HỌC (MOCK DATA)
const scheduleData = [
  {
    id: 1,
    day: "Thứ 2",
    date: "04/05",
    subject: "Toán cao cấp 1",
    room: "A203",
    time: "07:00 - 09:00",
    color: "bg-red-50 text-red-700 border-red-200",
    teacher: "TS. Nguyễn Văn A",
    floor: 2,
    building: "Nhà A",
    distance: "150m",
  },
  {
    id: 2,
    day: "Thứ 2",
    date: "04/05",
    subject: "Tiếng Anh 2",
    room: "C202",
    time: "11:00 - 13:00",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    teacher: "Ms. Jenny",
    floor: 3,
    building: "Nhà C",
    distance: "210m",
  },
  {
    id: 3,
    day: "Thứ 2",
    date: "04/05",
    subject: "Kỹ năng mềm",
    room: "D301",
    time: "15:00 - 17:00",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    teacher: "Thầy Lê Văn B",
    floor: 3,
    building: "Nhà D",
    distance: "90m",
  },
  {
    id: 4,
    day: "Thứ 3",
    date: "05/05",
    subject: "Lập trình cơ bản",
    room: "B101",
    time: "09:00 - 11:00",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    teacher: "Thầy Phạm C",
    floor: 1,
    building: "Nhà B",
    distance: "120m",
  },
  {
    id: 5,
    day: "Thứ 3",
    date: "05/05",
    subject: "Cơ sở dữ liệu",
    room: "A205",
    time: "13:00 - 15:00",
    color: "bg-orange-100 text-orange-800 border-orange-300",
    teacher: "Thầy Lê Hoàng Nam",
    floor: 2,
    building: "Nhà A",
    distance: "160m",
  },
  {
    id: 6,
    day: "Thứ 4",
    date: "06/05",
    subject: "Toán cao cấp 1",
    room: "A203",
    time: "07:00 - 09:00",
    color: "bg-red-50 text-red-700 border-red-200",
    teacher: "TS. Nguyễn Văn A",
    floor: 2,
    building: "Nhà A",
    distance: "150m",
  },
];

const timeSlots = [
  "07:00 - 09:00",
  "09:00 - 11:00",
  "11:00 - 13:00",
  "13:00 - 15:00",
  "15:00 - 17:00",
  "17:00 - 19:00",
  "19:00 - 21:00",
];

const daysOfWeek = [
  { label: "Thứ 2", date: "04/05" },
  { label: "Thứ 3", date: "05/05", isToday: true },
  { label: "Thứ 4", date: "06/05" },
  { label: "Thứ 5", date: "07/05" },
  { label: "Thứ 6", date: "08/05" },
  { label: "Thứ 7", date: "09/05" },
  { label: "Chủ nhật", date: "10/05" },
];

export default function SchedulePage() {
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  return (
    // THAY ĐỔI 1: Thêm min-h-screen và overflow-y-auto để đảm bảo trang luôn cuộn được
    <div className="p-6 bg-[#FDF8F6] min-h-screen pb-20 overflow-y-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch học</h1>
          <p className="text-sm text-gray-500">
            Tuần 1 - Tháng 5, 2026 (04/05/2026 - 10/05/2026)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-100 p-1">
            <button className="p-2 hover:bg-gray-50 rounded-md transition">
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 flex items-center gap-2 text-sm font-bold text-gray-700">
              <CalendarIcon size={16} className="text-red-500" />
              Tuần 1 - Tháng 5, 2026
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-md transition">
              <ChevronRight size={18} />
            </button>
          </div>
          <button className="px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-100 text-sm font-bold shadow-sm flex items-center gap-2">
            <CalendarIcon size={16} /> Hôm nay
          </button>
        </div>
      </div>

      {/* THAY ĐỔI 2: ĐƯA CARD CHI TIẾT LÊN ĐÂY ĐỂ LUÔN NHÌN THẤY */}
      {selectedSubject && (
        <div className="mb-8 p-6 bg-white rounded-2xl border border-red-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-red-600">
                {selectedSubject.subject || "Chưa có tên môn"}
              </h3>
              <p className="text-gray-500 text-sm font-medium">
                Chi tiết lịch học tập
              </p>
            </div>
            <button
              onClick={() => setSelectedSubject(null)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thông tin phòng */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Địa điểm
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">
                  {selectedSubject.building || "N/A"}
                </span>
                <span className="text-sm text-gray-700 font-semibold">
                  Phòng {selectedSubject.room || "---"} (Tầng{" "}
                  {selectedSubject.floor || "0"})
                </span>
              </div>
            </div>

            {/* Thông tin giảng viên */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Giảng viên
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                {selectedSubject.teacher || "Đang cập nhật"}
              </p>
            </div>

            {/* Thông tin thời gian */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Khung giờ
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                {selectedSubject.time || "---"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                const query = encodeURIComponent(
                  `${selectedSubject.building} Học viện Nông nghiệp Việt Nam`,
                );
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${query}`,
                  "_blank",
                );
              }}
              className="w-full md:w-auto px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-md shadow-red-100 transition-all flex items-center justify-center gap-2"
            >
              <MapPin size={16} /> Xem vị trí trên bản đồ
            </button>
          </div>
        </div>
      )}

      {/* --- BẢNG LỊCH HỌC --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 w-32">
                  Thời gian
                </th>
                {daysOfWeek.map((day, idx) => (
                  <th
                    key={idx}
                    className={`p-4 border-b border-gray-100 min-w-[150px] ${
                      day.isToday ? "bg-red-50/30" : ""
                    }`}
                  >
                    <div
                      className={`text-xs font-bold uppercase ${
                        day.isToday ? "text-red-500" : "text-gray-400"
                      }`}
                    >
                      {day.label}
                    </div>
                    <div
                      className={`text-sm font-black ${
                        day.isToday ? "text-red-600" : "text-gray-700"
                      }`}
                    >
                      {day.date}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, sIdx) => (
                <tr key={sIdx}>
                  <td className="p-4 text-center border-b border-r border-gray-50 text-xs font-bold text-gray-500 bg-gray-50/30">
                    {slot}
                  </td>
                  {daysOfWeek.map((day, dIdx) => {
                    const match = scheduleData.find(
                      (i) => i.day === day.label && i.time === slot,
                    );
                    return (
                      <td
                        key={dIdx}
                        className={`p-2 border-b border-r border-gray-50 align-top h-24 ${
                          day.isToday ? "bg-red-50/10" : ""
                        }`}
                      >
                        {match && (
                          <div
                            onClick={() => setSelectedSubject(match)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 ${
                              match.color
                            } ${
                              selectedSubject?.id === match.id
                                ? "ring-2 ring-red-400 shadow-md"
                                : ""
                            }`}
                          >
                            <div className="font-bold text-[13px] mb-1 leading-tight">
                              {match.subject}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-80 font-bold uppercase">
                              <MapPin size={10} /> Phòng: {match.room}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] opacity-80 mt-1">
                              <Clock size={10} /> {match.time}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
