"use client";

import { useState } from "react";
import { QrCode, ScanFace, ChevronRight, ChevronDown, Wifi } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurrentSession {
  mabuoihoc: number;
  tenmon: string;
  giangvien: string;
  phonghoc: string;
  gioVao: string;
  gioRa: string;
  day: string;
  month: string;
  maphancong: number;
}

export interface HocKyItem {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  danghieuluc: boolean;
}

interface AttendanceActionsProps {
  hocKyList: HocKyItem[];
  mahocky: number;
  hocKy: HocKyItem | null;
  currentSession: CurrentSession | null;
  filter: "month" | "semester";
  onFilterChange: (f: "month" | "semester") => void;
  onSemesterChange: (id: number) => void;
  onAttend: (mode: "qr" | "face") => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceActions({
  hocKyList,
  mahocky,
  hocKy,
  currentSession,
  filter,
  onFilterChange,
  onSemesterChange,
  onAttend,
}: AttendanceActionsProps) {
  const [semesterOpen, setSemesterOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Row 1: Tiêu đề + Nút điểm danh ── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký điểm danh</h1>
          <p className="text-gray-500 text-sm mt-1">
            Xem lại lịch sử chuyên cần của từng môn học
          </p>
        </div>

        {/* Nút điểm danh — luôn hiển thị */}
        <div className="flex items-center gap-2">
          {/* Nút QR */}
          <button
            id="btn-attend-qr"
            onClick={() => onAttend("qr")}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-lg transition-all active:scale-95 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            }}
          >
            <QrCode size={18} />
            <span>QR Code</span>
          </button>

          {/* Nút Khuôn mặt */}
          <button
            id="btn-attend-face"
            onClick={() => onAttend("face")}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-lg transition-all active:scale-95 hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #dc2626, #e11d48)",
              boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
            }}
          >
            <ScanFace size={18} />
            <span>Khuôn mặt</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: Thẻ buổi học hiện tại + Bộ lọc ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        {/* Thẻ buổi học / Trạng thái */}
        {currentSession ? (
          <div
            className="md:col-span-2 p-5 rounded-2xl flex justify-between items-center border transition-all"
            style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a20)",
              borderColor: "#fbbf24",
            }}
          >
            <div className="flex items-center gap-4">
              {/* Date badge */}
              <div className="bg-white p-3 rounded-xl text-center shadow-sm border border-yellow-100 flex-shrink-0">
                <span className="text-xl font-bold text-gray-800">{currentSession.day}</span>
                <span className="text-[10px] text-gray-400 block mt-0.5 uppercase font-semibold">
                  {currentSession.month}
                </span>
              </div>
              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                    <Wifi size={10} /> Đang mở điểm danh
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {currentSession.tenmon}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ⏰ {currentSession.gioVao}–{currentSession.gioRa} &nbsp;·&nbsp; 📍 {currentSession.phonghoc}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-amber-400 flex-shrink-0" />
          </div>
        ) : (
          <div className="md:col-span-2 p-5 rounded-2xl flex items-center gap-4 border border-gray-100 bg-gray-50">
            <div className="bg-gray-100 p-3 rounded-xl text-xl">🕐</div>
            <div>
              <p className="text-sm font-semibold text-gray-600">Không có buổi học nào đang mở điểm danh</p>
              <p className="text-xs text-gray-400 mt-0.5">Giảng viên sẽ mở khi bắt đầu buổi học</p>
            </div>
          </div>
        )}

        {/* Bộ lọc thời gian */}
        <div className="flex flex-col gap-2">
          {/* Dropdown chọn học kỳ */}
          <div className="relative">
            <button
              onClick={() => setSemesterOpen(!semesterOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition"
            >
              <span className="truncate">
                {hocKy
                  ? `HK${hocKy.ky} – ${hocKy.namhoc}–${hocKy.namhoc + 1}`
                  : "Chọn học kỳ"}
              </span>
              <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${semesterOpen ? "rotate-180" : ""}`} />
            </button>

            {semesterOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {hocKyList.map((hk) => (
                  <button
                    key={hk.mahocky}
                    onClick={() => {
                      onSemesterChange(hk.mahocky);
                      setSemesterOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition hover:bg-gray-50 flex items-center justify-between ${
                      hk.mahocky === mahocky ? "font-semibold text-indigo-600 bg-indigo-50" : "text-gray-700"
                    }`}
                  >
                    <span>HK{hk.ky} – {hk.namhoc}–{hk.namhoc + 1}</span>
                    {hk.danghieuluc && (
                      <span className="text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">
                        Hiện tại
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pill filter: Tháng / Học kỳ */}
          <div className="bg-gray-100 p-1.5 rounded-full flex gap-1 border border-gray-200">
            <button
              id="filter-month"
              onClick={() => onFilterChange("month")}
              className={`flex-1 px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tháng này
            </button>
            <button
              id="filter-semester"
              onClick={() => onFilterChange("semester")}
              className={`flex-1 px-4 py-2 rounded-full text-xs font-semibold transition ${
                filter === "semester"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Học kỳ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
