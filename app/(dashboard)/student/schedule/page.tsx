"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
// Types are defined locally below

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  BookOpen,
  User,
  Layers,
  LayoutGrid,
  List,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// ─── Types ────────────────────────────────────────────────────────────────────
interface HocKy {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  ngaybatdau: string;
  ngayketthuc: string;
  danghieuluc: boolean;
}

interface LichHoc {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  maphong: string | null;
  ghichu: string | null;
  timeRange: string;
  thuLabel: string;
  phancong?: {
    monhoc: { mamon: string; tenmon: string; sotinchi?: number } | null;
    giangvien: { magv: string; hoten: string } | null;
    hocky: HocKy | null;
    danghieuluc?: boolean;
    ngaybatdau?: string | null;
    ngayketthuc?: string | null;
  };
}

interface SemesterSubject {
  maphancong: number;
  monhoc: { mamon: string; tenmon: string; sotinchi: number } | null;
  giangvien: { magv: string; hoten: string } | null;
  hocky: HocKy | null;
  lichhoc: (LichHoc & { timeRange: string; thuLabel: string })[];
  danghieuluc?: boolean;
  ngaybatdau?: string | null;
  ngayketthuc?: string | null;
}

type ViewMode = "week" | "semester";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DAYS = [
  { thu: 2, label: "Thứ 2" },
  { thu: 3, label: "Thứ 3" },
  { thu: 4, label: "Thứ 4" },
  { thu: 5, label: "Thứ 5" },
  { thu: 6, label: "Thứ 6" },
  { thu: 7, label: "Thứ 7" },
  { thu: 8, label: "CN" },
];

const TIET_SLOTS = [
  { label: "Tiết 1", tietStart: 1, tietEnd: 1, time: "07:00 - 07:50" },
  { label: "Tiết 2", tietStart: 2, tietEnd: 2, time: "07:55 - 08:45" },
  { label: "Tiết 3", tietStart: 3, tietEnd: 3, time: "08:50 - 09:40" },
  { label: "Tiết 4", tietStart: 4, tietEnd: 4, time: "09:55 - 10:45" },
  { label: "Tiết 5", tietStart: 5, tietEnd: 5, time: "10:50 - 11:40" },
  { label: "Tiết 6", tietStart: 6, tietEnd: 6, time: "12:45 - 13:35" },
  { label: "Tiết 7", tietStart: 7, tietEnd: 7, time: "13:40 - 14:30" },
  { label: "Tiết 8", tietStart: 8, tietEnd: 8, time: "14:35 - 15:25" },
  { label: "Tiết 9", tietStart: 9, tietEnd: 9, time: "15:40 - 16:30" },
  { label: "Tiết 10", tietStart: 10, tietEnd: 10, time: "16:35 - 17:25" },
];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Màu sắc theo môn học (dựa trên maphancong % 8)
const SUBJECT_COLORS = [
  "bg-red-50 text-red-700 border-red-200",
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-pink-50 text-pink-700 border-pink-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

function getColor(maphancong: number): string {
  return SUBJECT_COLORS[maphancong % SUBJECT_COLORS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [hocKyList, setHocKyList] = useState<HocKy[]>([]);
  const [selectedMahocky, setSelectedMahocky] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<LichHoc[]>([]);
  const [semesterData, setSemesterData] = useState<SemesterSubject[]>([]);
  const [loading, setLoading] = useState(false);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);
  const [selectedItem, setSelectedItem] = useState<LichHoc | null>(null);

  // Lấy danh sách học kỳ
  useEffect(() => {
    apiFetch("/api/sinhvien/hocky")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setHocKyList(json.data);
          const current = json.data.find((h: HocKy) => h.danghieuluc);
          if (current) setSelectedMahocky(current.mahocky);
          else if (json.data.length > 0) setSelectedMahocky(json.data[0].mahocky);
        }
      })
      .catch(() => { });
  }, []);

  // Fetch lịch tuần
  const fetchWeek = useCallback(async (mahocky: number | null) => {
    setLoading(true);
    setSelectedItem(null);
    try {
      const params = mahocky ? `?mode=week&mahocky=${mahocky}` : "?mode=week";
      const res = await apiFetch(`/api/sinhvien/schedule${params}`);
      const json = await res.json();
      if (json.success) setWeekData(json.data ?? []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  // Fetch lịch học kỳ
  const fetchSemester = useCallback(async (mahocky: number) => {
    setLoading(true);
    setSelectedItem(null);
    try {
      const res = await apiFetch(`/api/sinhvien/schedule?mode=semester&mahocky=${mahocky}`);
      const json = await res.json();
      if (json.success) setSemesterData(json.data ?? []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  // Khi đổi mode hoặc học kỳ
  useEffect(() => {
    if (viewMode === "week") {
      fetchWeek(selectedMahocky);
    } else if (selectedMahocky) {
      fetchSemester(selectedMahocky);
    }
  }, [viewMode, selectedMahocky, fetchWeek, fetchSemester]);

  // Tính ngày của các cột trong tuần
  const weekDates = DAYS.map((d, i) => ({
    ...d,
    date: addDays(weekStart, i),
    isToday: addDays(weekStart, i).toDateString() === new Date().toDateString(),
  }));

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
        {!loading && selectedItem && (
          <div className="mb-6 p-6 bg-white rounded-2xl border border-red-200 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-red-600">
                  {selectedItem.phancong?.monhoc?.tenmon ?? "Chưa có tên môn"}
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                  {selectedItem.thuLabel} • {selectedItem.timeRange} • Tiết {selectedItem.tietbatdau}–{selectedItem.tietketthuc}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Phòng học</p>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-red-400" />
                  <span className="text-sm font-bold text-gray-800">
                    {selectedItem.maphong ?? "Chưa xếp phòng"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Giảng viên</p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-blue-400" />
                  <span className="text-sm font-bold text-gray-800">
                    {selectedItem.phancong?.giangvien?.hoten ?? "Đang cập nhật"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Khung giờ</p>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-green-400" />
                  <span className="text-sm font-bold text-gray-800">{selectedItem.timeRange}</span>
                </div>
              </div>
            </div>

            {selectedItem.ghichu && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">{selectedItem.ghichu}</p>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: TUẦN ── */}
        {!loading && viewMode === "week" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {weekData.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
                <CalendarIcon size={48} strokeWidth={1} />
                <p className="text-sm">Không có lịch học trong học kỳ này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="p-2 text-xs font-bold text-[#6B3F2E] bg-[#FFDAC1] border-b border-[#F5C29F] w-16">
                        Buổi học
                      </th>
                      {weekDates.map((d) => (
                        <th
                          key={d.thu}
                          className={`p-2 border-b border-gray-200 min-w-[110px] ${d.isToday ? "bg-red-50/30" : ""}`}
                        >
                          <div className={`text-[10px] font-bold uppercase ${d.isToday ? "text-red-500" : "text-gray-400"}`}>
                            {d.label}
                          </div>
                          <div className={`text-xs font-black ${d.isToday ? "text-red-600" : "text-gray-700"}`}>
                            {formatDateShort(d.date)}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 text-xs font-bold text-[#6B3F2E] bg-[#FFDAC1] border-b border-[#F5C29F] w-16">
                        Thời gian
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {TIET_SLOTS.map((slot) => (
                      <tr key={slot.label} className="h-[52px]">
                        <td className="p-1 text-center border-b border-r border-[#F5C29F] bg-[#FFE9D4] text-[#6B3F2E] font-semibold text-xs w-16">
                          {slot.label}
                        </td>
                        {weekDates.map((d) => {
                          // Check if this slot is covered by an ongoing class that started earlier
                          const isCovered = weekData.some((lh) => {
                            if (lh.thutrongtuan !== d.thu) return false;

                            const pc = lh.phancong;
                            if (pc) {
                              const yyyy = d.date.getFullYear();
                              const mm = String(d.date.getMonth() + 1).padStart(2, "0");
                              const dd = String(d.date.getDate()).padStart(2, "0");
                              const dateStr = `${yyyy}-${mm}-${dd}`;
                              if (pc.ngaybatdau && dateStr < pc.ngaybatdau) return false;
                              if (pc.ngayketthuc && dateStr > pc.ngayketthuc) return false;
                            }

                            return lh.tietbatdau < slot.tietStart && lh.tietketthuc >= slot.tietStart;
                          });

                          if (isCovered) return null;

                          const matches = weekData.filter((lh) => {
                            const isDayMatch =
                              lh.thutrongtuan === d.thu &&
                              lh.tietbatdau === slot.tietStart;
                            if (!isDayMatch) return false;

                            const pc = lh.phancong;
                            if (!pc) return true;

                            const yyyy = d.date.getFullYear();
                            const mm = String(d.date.getMonth() + 1).padStart(2, "0");
                            const dd = String(d.date.getDate()).padStart(2, "0");
                            const dateStr = `${yyyy}-${mm}-${dd}`;

                            if (pc.ngaybatdau && dateStr < pc.ngaybatdau) {
                              return false;
                            }
                            if (pc.ngayketthuc && dateStr > pc.ngayketthuc) {
                              return false;
                            }
                            return true;
                          });

                          // Calculate rowSpan
                          let rowSpan = 1;
                          if (matches.length > 0) {
                            const firstMatch = matches[0];
                            rowSpan = firstMatch.tietketthuc - firstMatch.tietbatdau + 1;
                            if (isNaN(rowSpan) || rowSpan < 1) rowSpan = 1;
                          }

                          return (
                            <td
                              key={d.thu}
                              rowSpan={rowSpan}
                              className={`p-1 border-b border-r border-gray-200 align-top ${d.isToday ? "bg-red-50/10" : ""}`}
                              style={{ height: `${rowSpan * 52}px` }}
                            >
                              {matches.map((lh) => (
                                <div
                                  key={lh.malichhoc}
                                  onClick={() => setSelectedItem(lh)}
                                  className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 mb-0.5 ${getColor(lh.maphancong)} ${selectedItem?.malichhoc === lh.malichhoc ? "ring-2 ring-red-400 shadow-md" : ""
                                    }`}
                                  style={{ height: "calc(100% - 2px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                                >
                                  <div className="font-bold text-[11px] leading-tight line-clamp-2">
                                    {lh.phancong?.monhoc?.tenmon ?? "Môn học"}
                                  </div>

                                  {/* Hết khoảng trống: hiển thị toàn bộ thông tin có trong lịch học tương ứng với chiều cao ô */}
                                  {lh.tietketthuc - lh.tietbatdau >= 1 && (
                                    <div className="flex-1 flex flex-col justify-start py-1 gap-1 text-[9px] opacity-90 leading-tight select-none">
                                      {/* 1. Mã môn học & Số tín chỉ */}
                                      <div className="text-[9px] text-gray-500 font-medium flex items-center justify-between flex-wrap gap-1">
                                        {lh.phancong?.monhoc?.mamon && (
                                          <span>Mã môn: <span className="font-bold">{lh.phancong.monhoc.mamon}</span></span>
                                        )}
                                        {lh.phancong?.monhoc?.sotinchi !== undefined && (
                                          <span className="bg-red-50 text-red-600 px-1 rounded text-[8px] font-bold">
                                            {lh.phancong.monhoc.sotinchi} tín chỉ
                                          </span>
                                        )}
                                      </div>

                                      {/* 2. Giảng viên */}
                                      {lh.phancong?.giangvien?.hoten && (
                                        <div className="flex items-center gap-1 font-bold text-slate-700">
                                          <User size={8} className="shrink-0 text-blue-500" />
                                          <span className="truncate">GV: {lh.phancong.giangvien.hoten}</span>
                                        </div>
                                      )}

                                      {/* 3. Mã giảng viên (chỉ hiện từ 3 tiết trở lên) */}
                                      {lh.tietketthuc - lh.tietbatdau >= 2 && lh.phancong?.giangvien?.magv && (
                                        <div className="text-[9px] text-gray-500 font-medium ml-3">
                                          Mã GV: <span className="font-bold">{lh.phancong.giangvien.magv}</span>
                                        </div>
                                      )}

                                      {/* 4. Khung giờ & Tiết học cụ thể */}
                                      {lh.tietketthuc - lh.tietbatdau >= 2 && (
                                        <div className="flex flex-col gap-0.5 text-slate-600 font-medium">
                                          {lh.timeRange && (
                                            <div className="flex items-center gap-1">
                                              <Clock size={8} className="shrink-0 text-green-500" />
                                              <span>Giờ: {lh.timeRange}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1 font-bold text-slate-700 ml-3">
                                            <span>Tiết học: {lh.tietbatdau} – {lh.tietketthuc}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* 5. Ghi chú (nếu có, hiện khi hàng rất dài từ 4 tiết trở lên) */}
                                      {lh.tietketthuc - lh.tietbatdau >= 3 && lh.ghichu && (
                                        <div className="mt-1 p-1 bg-yellow-50/50 rounded border border-yellow-100 text-[8px] text-amber-800 italic line-clamp-2">
                                          Note: {lh.ghichu}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5 mt-1 text-[9px] opacity-90 font-bold flex-wrap">
                                    <span className="flex items-center gap-0.5"><MapPin size={8} /> {lh.maphong ?? "---"}</span>
                                    <span className="flex items-center gap-0.5 opacity-80"><Clock size={8} /> T{lh.tietbatdau}–{lh.tietketthuc}</span>
                                  </div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                        <td className="p-1 text-center border-b border-l border-[#F5C29F] bg-[#FFE9D4] text-[#6B3F2E] font-semibold text-xs w-16">
                          {slot.time.split(" - ")[0]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: HỌC KỲ ── */}
        {!loading && viewMode === "semester" && (
          <div>
            {semesterData.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-gray-400 gap-3 bg-white rounded-2xl border border-gray-100">
                <Layers size={48} strokeWidth={1} />
                <p className="text-sm">Không có môn học trong học kỳ này</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {semesterData.map((subject) => {
                  const now = new Date();
                  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                  const isExpired = subject.ngayketthuc && subject.ngayketthuc < todayStr;
                  return (
                    <div
                      key={subject.maphancong}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
                    >
                      {/* Tên môn */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getColor(subject.maphancong)}`}>
                          <BookOpen size={18} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm leading-tight">
                            {subject.monhoc?.tenmon ?? "Chưa có tên"}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">{subject.monhoc?.mamon}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {subject.monhoc?.sotinchi && (
                              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                                {subject.monhoc.sotinchi} tín chỉ
                              </span>
                            )}
                            {isExpired ? (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">
                                Đã kết thúc
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">
                                Đang học
                              </span>
                            )}
                          </div>
                          {subject.ngaybatdau && subject.ngayketthuc && (
                            <p className="text-[10px] text-gray-400 mt-1.5 font-bold">
                              Thời gian: {new Date(subject.ngaybatdau).toLocaleDateString("vi-VN")} - {new Date(subject.ngayketthuc).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Giảng viên */}
                      <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                        <User size={13} className="text-gray-400 shrink-0" />
                        <span className="font-medium">{subject.giangvien?.hoten ?? "Đang cập nhật"}</span>
                      </div>

                      {/* Lịch học cố định */}
                      <div className="space-y-1.5">
                        {subject.lichhoc.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Chưa có lịch học</p>
                        ) : (
                          subject.lichhoc.map((lh) => (
                            <div
                              key={lh.malichhoc}
                              className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                            >
                              <span className="text-xs font-bold text-gray-700 min-w-[52px]">{lh.thuLabel}</span>
                              <Clock size={11} className="text-gray-400" />
                              <span className="text-xs text-gray-600">{lh.timeRange}</span>
                              {lh.maphong && (
                                <>
                                  <MapPin size={11} className="text-gray-400 ml-auto shrink-0" />
                                  <span className="text-xs font-bold text-gray-700">{lh.maphong}</span>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardShell>
  );
}
