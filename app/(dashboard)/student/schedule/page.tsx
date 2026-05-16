"use client";

import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/services/auth.service";
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
  Map as MapIcon,
  X,
  Plus,
  Minus,
  Maximize2,
  Move,
} from "lucide-react";

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

interface LichHoc{
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
    monhoc: { mamon: string; tenmon: string } | null;
    giangvien: { magv: string; hoten: string } | null;
    hocky: HocKy | null;
  };
}

interface SemesterSubject {
  maphancong: number;
  monhoc: { mamon: string; tenmon: string; sotinchi: number } | null;
  giangvien: { magv: string; hoten: string } | null;
  hocky: HocKy | null;
  lichhoc: (LichHoc & { timeRange: string; thuLabel: string })[];
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
  { label: "Tiết 1-3", tietStart: 1, tietEnd: 3, time: "07:00 - 09:30" },
  { label: "Tiết 4-6", tietStart: 4, tietEnd: 6, time: "09:30 - 12:00" },
  { label: "Tiết 7-9", tietStart: 7, tietEnd: 9, time: "12:30 - 15:00" },
  { label: "Tiết 10-12", tietStart: 10, tietEnd: 12, time: "15:00 - 17:30" },
  { label: "Tiết 13-15", tietStart: 13, tietEnd: 15, time: "18:00 - 20:30" },
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
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [hocKyList, setHocKyList] = useState<HocKy[]>([]);
  const [selectedMahocky, setSelectedMahocky] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekData, setWeekData] = useState<LichHoc[]>([]);
  const [semesterData, setSemesterData] = useState<SemesterSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LichHoc| null>(null);
  const [showMap, setShowMap] = useState(false);
  
  // State cho Zoom & Pan (giữ lại nếu cần cho các tính năng khác, nhưng modal map sẽ đơn giản hơn)
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.5, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.5, 1));
  const handleResetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(z => Math.max(1, Math.min(z + delta, 5)));
  };

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
      .catch(() => {});
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
    } catch {}
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
    } catch {}
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                viewMode === "week"
                  ? "bg-[#E57373] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={15} /> Tuần
            </button>
            <button
              onClick={() => setViewMode("semester")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                viewMode === "semester"
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

          {viewMode === "week" && (
            <button
              onClick={() => setShowMap(true)}
              className="px-4 py-2 bg-white text-red-600 rounded-xl border border-red-100 text-sm font-bold shadow-sm hover:bg-red-50 transition flex items-center gap-1.5"
            >
              <MapIcon size={14} /> Xem bản đồ
            </button>
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 w-28">
                      Buổi học
                    </th>
                    {weekDates.map((d) => (
                      <th
                        key={d.thu}
                        className={`p-4 border-b border-gray-100 min-w-[140px] ${d.isToday ? "bg-red-50/30" : ""}`}
                      >
                        <div className={`text-xs font-bold uppercase ${d.isToday ? "text-red-500" : "text-gray-400"}`}>
                          {d.label}
                        </div>
                        <div className={`text-sm font-black ${d.isToday ? "text-red-600" : "text-gray-700"}`}>
                          {formatDateShort(d.date)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIET_SLOTS.map((slot) => (
                    <tr key={slot.label}>
                      <td className="p-3 text-center border-b border-r border-gray-50 bg-gray-50/30">
                        <p className="text-[11px] font-bold text-gray-600">{slot.label}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{slot.time}</p>
                      </td>
                      {weekDates.map((d) => {
                        const matches = weekData.filter(
                          (lh) =>
                            lh.thutrongtuan === d.thu &&
                            lh.tietbatdau >= slot.tietStart &&
                            lh.tietbatdau <= slot.tietEnd
                        );
                        return (
                          <td
                            key={d.thu}
                            className={`p-2 border-b border-r border-gray-50 align-top h-24 ${d.isToday ? "bg-red-50/10" : ""}`}
                          >
                            {matches.map((lh) => (
                              <div
                                key={lh.malichhoc}
                                onClick={() => setSelectedItem(lh)}
                                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 mb-1 ${getColor(lh.maphancong)} ${
                                  selectedItem?.malichhoc === lh.malichhoc ? "ring-2 ring-red-400 shadow-md" : ""
                                }`}
                              >
                                <div className="font-bold text-[12px] mb-1 leading-tight line-clamp-2">
                                  {lh.phancong?.monhoc?.tenmon ?? "Môn học"}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] opacity-80 font-bold">
                                  <MapPin size={9} /> {lh.maphong ?? "---"}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] opacity-70 mt-0.5">
                                  <Clock size={9} /> T{lh.tietbatdau}–{lh.tietketthuc}
                                </div>
                              </div>
                            ))}
                          </td>
                        );
                      })}
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
              {semesterData.map((subject) => (
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
                      {subject.monhoc?.sotinchi && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                          {subject.monhoc.sotinchi} tín chỉ
                        </span>
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
              ))}
            </div>
          )}
        </div>
      )}
      {/* ── MODAL BẢN ĐỒ ── */}
      {showMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setShowMap(false)}
          />
          <div className="relative bg-white w-full max-w-6xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp border border-white/20">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
                  <MapIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">Bản đồ Học viện Nông nghiệp</h3>
                  <p className="text-xs text-gray-400">Khuôn viên Trâu Quỳ, Gia Lâm, Hà Nội</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Map Content */}
            <div className="flex-1 relative bg-gray-50 overflow-hidden">
               <iframe
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1862.383134907954!2d105.9318!3d21.0016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135a96d36e2f171%3A0x6b6379893d7c50!2zSOG7jWMgdmnhu4duIE7DtG5nIG5naGnhu4dwIFZp4buHdCBOYW0!5e0!3m2!1svi!2s!4v1715851253456!5m2!1svi!2s"
                 width="100%"
                 height="100%"
                 style={{ border: 0 }}
                 allowFullScreen
                 loading="lazy"
                 referrerPolicy="no-referrer-when-downgrade"
                 className="w-full h-full"
               />
              
              {/* Overlay Info */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div className="bg-white/90 backdrop-blur shadow-lg border border-gray-100 p-4 rounded-2xl pointer-events-auto max-w-[280px]">
                  <p className="text-xs font-bold text-gray-800 mb-1">Bản đồ Học viện</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Sử dụng phím Ctrl + Kéo chuột để thay đổi góc nhìn 3D trên bản đồ.
                  </p>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                   <a 
                    href="https://map.vnua.edu.vn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white text-gray-700 text-xs font-bold rounded-xl shadow-lg border border-gray-100 hover:bg-gray-50 transition flex items-center gap-2"
                   >
                     Xem map.vnua.edu.vn
                   </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
