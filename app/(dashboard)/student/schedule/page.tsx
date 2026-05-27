"use client";

import React, { useState, useEffect } from "react";
import { useStudentSchedule, LichHoc } from "@/hooks/sinhvien/useStudentSchedule";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getMonday, addDays, formatDateShort } from "@/lib/utils/date.utils";
import { SubjectDetailPanel } from "@/components/student/schedule/SubjectDetailPanel";
import { WeekView } from "@/components/student/schedule/WeekView";
import { SemesterView } from "@/components/student/schedule/SemesterView";

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const {
    viewMode,
    setViewMode,
    selectedMahocky,
    setSelectedMahocky,
    weekData,
    semesterData,
    hocKyList,
    loading,
  } = useStudentSchedule();

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedItem, setSelectedItem] = useState<LichHoc | null>(null);

  const currentHocKy = hocKyList.find((h) => h.mahocky === selectedMahocky);

  return (
    <DashboardShell pageTitle="Lịch học">
      <div className="p-6 bg-[#FDF8F6] min-h-screen pb-20">
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lịch học</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentHocKy ? currentHocKy.tenhocky : "Đang tải..."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Tuần / Học Kỳ */}
            <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm p-1 gap-1">
              <button
                onClick={() => setViewMode("week")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "week"
                    ? "bg-[#E57373] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <LayoutGrid size={15} /> Tuần
              </button>
              <button
                onClick={() => setViewMode("semester")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === "semester"
                    ? "bg-[#E57373] text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                  }`}
              >
                <List size={15} /> Học Kỳ
              </button>
            </div>

            {/* Dropdown chọn học kỳ */}
            <select
              value={selectedMahocky ?? ""}
              onChange={(e) => setSelectedMahocky(parseInt(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-red-100 text-gray-700"
            >
              {hocKyList.map((hk) => (
                <option key={hk.mahocky} value={hk.mahocky}>
                  {hk.tenhocky}{hk.danghieuluc ? " ★" : ""}
                </option>
              ))}
            </select>

            {/* Điều hướng tuần (chỉ hiện ở mode tuần) */}
            {viewMode === "week" && (
              <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm">
                <button
                  onClick={() => setWeekStart((w) => addDays(w, -7))}
                  className="p-2.5 hover:bg-gray-50 rounded-l-xl transition"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-3 flex items-center gap-2 text-sm font-bold text-gray-700 min-w-[160px] justify-center">
                  <CalendarIcon size={14} className="text-red-500" />
                  {formatDateShort(weekStart)} – {formatDateShort(addDays(weekStart, 6))}
                </div>
                <button
                  onClick={() => setWeekStart((w) => addDays(w, 7))}
                  className="p-2.5 hover:bg-gray-50 rounded-r-xl transition"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div className="flex justify-center items-center py-20 text-gray-400">
            <Loader2 size={28} className="animate-spin mr-3" />
            <span className="text-sm">Đang tải lịch học...</span>
          </div>
        )}

        {/* ── CHI TIẾT MÔN HỌC (khi click) ── */}
        {!loading && (
          <SubjectDetailPanel
            selectedItem={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}

        {/* ── VIEW: TUẦN ── */}
        {!loading && viewMode === "week" && (
          <WeekView
            weekData={weekData}
            weekStart={weekStart}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
          />
        )}

        {/* ── VIEW: HỌC KỲ ── */}
        {!loading && viewMode === "semester" && (
          <SemesterView semesterData={semesterData} />
        )}
      </div>
    </DashboardShell>
  );
}
