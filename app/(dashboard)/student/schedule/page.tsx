"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, BookOpen, RefreshCw, LayoutGrid, List, MapPin, Clock } from "lucide-react";
import {
  getWeekSchedule, getSemesterSchedule, shortHocKy, THU_NUMS, THU_LABELS,
  tietToTime, type WeekScheduleItem, type SemesterSubjectItem, type HocKyItem,
} from "@/services/schedule.service";

// ─── Tiết rows (1–13) ────────────────────────────────────────────────────────
const ALL_TIETS = [1,2,3,4,5,6,7,8,9,10,11,12,13];

const TIET_DISPLAY_TIME: Record<number,string> = {
  1:"07:00", 2:"07:55", 3:"08:50", 4:"09:55", 5:"10:50",
  6:"12:45", 7:"13:40", 8:"14:35", 9:"15:40", 10:"16:35",
  11:"18:00", 12:"18:55", 13:"19:50",
};

// ─── Week helpers ─────────────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=CN
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDDMM(d: Date): string {
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [view, setView]           = useState<"week"|"semester">("week");
  const [mahocky, setMahocky]     = useState<number|undefined>(undefined);
  const [hocKyList, setHocKyList] = useState<HocKyItem[]>([]);
  const [hocKy, setHocKy]         = useState<HocKyItem|null>(null);
  const [weekData, setWeekData]   = useState<WeekScheduleItem[]>([]);
  const [semData, setSemData]     = useState<SemesterSubjectItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WeekScheduleItem|null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string|null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // tuần hiện tại = 0

  // Tính ngày thứ 2 của tuần đang xem
  const monday = addDays(getMonday(new Date()), weekOffset * 7);
  // Mảng ngày trong tuần [T2, T3, T4, T5, T6, T7, CN]
  const weekDates = Array.from({length:7}, (_,i) => addDays(monday, i));
  const todayStr = fmtDDMM(new Date());

  // ─── Tải dữ liệu ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async (v:"week"|"semester", mhk?:number) => {
    setLoading(true); setError(null); setSelectedItem(null);
    try {
      if (v === "week") {
        const res = await getWeekSchedule(mhk);
        setHocKyList(res.hocKyList); setHocKy(res.hocKy); setWeekData(res.data);
        if (!mahocky && res.mahocky) setMahocky(res.mahocky);
      } else {
        const res = await getSemesterSchedule(mhk);
        setHocKyList(res.hocKyList); setHocKy(res.hocKy); setSemData(res.data);
        if (!mahocky && res.mahocky) setMahocky(res.mahocky);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải lịch học.");
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(view, mahocky); }, [view, mahocky, fetchData]);

  // ─── Điều hướng học kỳ ────────────────────────────────────────────────────
  function goHocKy(delta:number) {
    const idx = hocKyList.findIndex(hk => hk.mahocky === mahocky);
    const next = idx + delta;
    if (next >= 0 && next < hocKyList.length) setMahocky(hocKyList[next].mahocky);
  }
  const currentIdx = hocKyList.findIndex(hk => hk.mahocky === mahocky);

  // ─── Build occupied map (cho rowspan) ─────────────────────────────────────
  // occupied[thu][tiet] = true nếu ô đó đã được cover bởi rowspan từ trên
  const occupied: Record<number, Record<number,boolean>> = {};
  weekData.forEach(item => {
    for (let t = item.tietBatDau + 1; t <= item.tietKetThuc; t++) {
      if (!occupied[item.thu]) occupied[item.thu] = {};
      occupied[item.thu][t] = true;
    }
  });

  // Tra cứu nhanh weekData theo [thu][tietBatDau]
  const byCell: Record<number, Record<number, WeekScheduleItem>> = {};
  weekData.forEach(item => {
    if (!byCell[item.thu]) byCell[item.thu] = {};
    byCell[item.thu][item.tietBatDau] = item;
  });

  // Tổng tín chỉ học kỳ
  const totalTinchi = semData.reduce((s,m) => s + (m.sotinchi ?? 0), 0);

  // ─── Header toolbar ────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Lịch học</h1>
        <p className="text-sm text-gray-500">
          {hocKy ? hocKy.tenhocky : "Chọn học kỳ"}
          {hocKy?.ngaybatdau ? ` • ${new Date(hocKy.ngaybatdau).toLocaleDateString("vi-VN")} – ${new Date(hocKy.ngayketthuc!).toLocaleDateString("vi-VN")}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle view */}
        <div className="flex bg-white rounded-lg border border-gray-100 shadow-sm p-1 gap-1">
          <button onClick={() => setView("week")}
            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1.5 transition ${view==="week" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <LayoutGrid size={14}/> Theo tuần
          </button>
          <button onClick={() => setView("semester")}
            className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-1.5 transition ${view==="semester" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <List size={14}/> Theo học kỳ
          </button>
        </div>

        {/* Chọn học kỳ */}
        <div className="flex bg-white rounded-lg border border-gray-100 shadow-sm p-1 items-center">
          <button onClick={() => goHocKy(1)} disabled={currentIdx >= hocKyList.length-1}
            className="p-1.5 hover:bg-gray-50 rounded-md transition disabled:opacity-30">
            <ChevronLeft size={16}/>
          </button>
          <span className="px-3 text-sm font-bold text-gray-700 min-w-[140px] text-center">
            {hocKy ? shortHocKy(hocKy) : "---"}
            {hocKy?.danghieuluc && <span className="ml-1 text-[9px] bg-green-100 text-green-700 px-1 rounded-full font-bold">Hiện tại</span>}
          </span>
          <button onClick={() => goHocKy(-1)} disabled={currentIdx <= 0}
            className="p-1.5 hover:bg-gray-50 rounded-md transition disabled:opacity-30">
            <ChevronRight size={16}/>
          </button>
        </div>

        {/* Dropdown học kỳ */}
        {hocKyList.length > 0 && (
          <select value={mahocky ?? ""} onChange={e => setMahocky(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm text-gray-700 shadow-sm outline-none cursor-pointer">
            {hocKyList.map(hk => <option key={hk.mahocky} value={hk.mahocky}>{hk.tenhocky}</option>)}
          </select>
        )}

        <button onClick={() => fetchData(view, mahocky)}
          className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-red-500 shadow-sm transition" title="Làm mới">
          <RefreshCw size={16}/>
        </button>
      </div>
    </div>
  );

  // ─── Day header row ────────────────────────────────────────────────────────
  const CELL_DARK = { backgroundColor: '#374151', color: '#ffffff' }; // gray-700
  const CELL_TODAY = { backgroundColor: '#dc2626', color: '#ffffff' }; // red-600

  const dayHeader = (
    <tr className="text-sm">
      <td className="p-2 border border-gray-600 w-16 text-center" style={CELL_DARK}>
        {view === "week" && (
          <button onClick={() => setWeekOffset(w => w-1)} className="hover:text-red-300 transition">
            <ChevronLeft size={18}/>
          </button>
        )}
      </td>
      {THU_NUMS.map((thu, idx) => {
        const d = weekDates[idx];
        const dateStr = fmtDDMM(d);
        const isToday = dateStr === todayStr;
        return (
          <td key={thu}
            className="p-2 border border-gray-600 text-center font-bold min-w-[120px]"
            style={isToday ? CELL_TODAY : CELL_DARK}
          >
            {THU_LABELS[idx]}<br/>
            <span className="text-xs font-normal opacity-90">({dateStr})</span>
          </td>
        );
      })}
      <td className="p-2 border border-gray-600 w-16 text-center text-xs font-normal" style={{ ...CELL_DARK, color: '#9ca3af' }}>Giờ</td>
      <td className="p-2 border border-gray-600 w-10 text-center" style={CELL_DARK}>
        {view === "week" && (
          <button onClick={() => setWeekOffset(w => w+1)} className="hover:text-red-300 transition">
            <ChevronRight size={18}/>
          </button>
        )}
      </td>
    </tr>
  );

  return (
    <div className="p-4 bg-[#FDF8F6] min-h-screen pb-20 overflow-y-auto">
      {toolbar}

      {/* Loading / Error */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-400">
          <Loader2 size={36} className="animate-spin text-red-400"/>
          <span className="text-sm">Đang tải lịch học...</span>
        </div>
      )}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-60 gap-3 text-red-400">
          <AlertCircle size={36}/><span className="text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ─── BẢNG LỊCH TUẦN (dạng tiết × thứ) ─────────────────────── */}
          {view === "week" && (
            <>
              {/* Chi tiết môn khi click */}
              {selectedItem && (
                <div className="mb-4 p-5 bg-white rounded-2xl border border-red-200 shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-red-600">{selectedItem.tenmon}</h3>
                      <p className="text-xs text-gray-400">{selectedItem.thuLabel} • Tiết {selectedItem.tietBatDau}–{selectedItem.tietKetThuc} ({selectedItem.gioVao}–{selectedItem.gioRa})</p>
                    </div>
                    <button onClick={() => setSelectedItem(null)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">✕</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Phòng</p><p className="font-semibold text-gray-700">{selectedItem.phonghoc}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Giảng viên</p><p className="font-semibold text-gray-700">{selectedItem.giangvien}</p></div>
                    <div><p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Mã môn</p><p className="font-semibold text-gray-700">{selectedItem.mamon}</p></div>
                  </div>
                  {selectedItem.ghichu && <p className="mt-3 text-xs text-gray-500 italic border-t pt-2">📌 {selectedItem.ghichu}</p>}
                </div>
              )}

              {weekData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-300">
                  <BookOpen size={48} strokeWidth={1}/>
                  <p className="text-sm">Không có lịch học trong học kỳ này.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>{dayHeader}</thead>
                      <tbody>
                        {ALL_TIETS.map(tiet => (
                          <tr key={tiet} className="hover:bg-gray-50/40">
                            {/* Cột tiết */}
                            <td className="border border-gray-200 p-1 text-center font-bold text-gray-500 bg-gray-50 w-16">
                              Tiết {tiet}
                            </td>
                            {/* Cột thứ */}
                            {THU_NUMS.map(thu => {
                              // Bỏ qua nếu đã bị chiếm bởi rowspan
                              if (occupied[thu]?.[tiet]) return null;
                              const item = byCell[thu]?.[tiet];
                              const rowspan = item ? (item.tietKetThuc - item.tietBatDau + 1) : 1;
                              const isToday = fmtDDMM(weekDates[thu-2]) === todayStr;
                              return (
                                <td key={thu}
                                  rowSpan={rowspan}
                                  className={`border border-gray-200 p-1 align-top ${isToday ? "bg-red-50/20" : ""} ${item ? "cursor-pointer" : ""}`}
                                  onClick={() => item && setSelectedItem(item)}
                                >
                                  {item && (
                                    <div className={`p-2 rounded-lg border h-full flex flex-col gap-0.5 transition hover:shadow-md hover:scale-[1.02] active:scale-95 ${item.color} ${selectedItem?.maphancong === item.maphancong && selectedItem?.thu === item.thu && selectedItem?.tietBatDau === item.tietBatDau ? "ring-2 ring-red-400" : ""}`}>
                                      <div className="font-bold text-[11px] leading-tight">{item.tenmon}</div>
                                      <div className="text-[10px] opacity-75">({item.mamon})</div>
                                      <div className="flex items-center gap-0.5 text-[10px] opacity-80 mt-0.5">
                                        <MapPin size={8}/> {item.phonghoc}
                                      </div>
                                      <div className="text-[10px] opacity-75">GV: {item.giangvien}</div>
                                      <div className="flex items-center gap-0.5 text-[10px] opacity-80">
                                        <Clock size={8}/> {item.gioVao} → {item.gioRa}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            {/* Cột giờ */}
                            <td className="border border-gray-200 p-1 text-center text-[11px] font-bold text-gray-500 bg-gray-50 w-16">
                              {TIET_DISPLAY_TIME[tiet]}
                            </td>
                            {/* Placeholder cột nút */}
                            <td className="border border-gray-200 w-10 bg-gray-50"/>
                          </tr>
                        ))}
                        {/* Footer row */}
                        <tr className="text-sm">
                          <td className="p-2 border border-gray-600 text-center" style={CELL_DARK}>
                            <button onClick={() => setWeekOffset(w => w-1)} className="hover:text-red-300">
                              <ChevronLeft size={18}/>
                            </button>
                          </td>
                          {THU_NUMS.map((thu,idx) => {
                            const d = weekDates[idx];
                            const isToday = fmtDDMM(d) === todayStr;
                            return (
                              <td key={thu}
                                className="p-2 border border-gray-600 text-center font-bold"
                                style={isToday ? CELL_TODAY : CELL_DARK}
                              >
                                {THU_LABELS[idx]}<br/>
                                <span className="text-xs font-normal opacity-90">({fmtDDMM(d)})</span>
                              </td>
                            );
                          })}
                          <td className="p-2 border border-gray-600" style={CELL_DARK}/>
                          <td className="p-2 border border-gray-600 text-center" style={CELL_DARK}>
                            <button onClick={() => setWeekOffset(w => w+1)} className="hover:text-red-300">
                              <ChevronRight size={18}/>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── DANH SÁCH MÔN THEO HỌC KỲ ─────────────────────────────── */}
          {view === "semester" && (
            semData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-gray-300">
                <BookOpen size={48} strokeWidth={1}/>
                <p className="text-sm">Không có môn học đăng ký trong học kỳ này.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex gap-3">
                  <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-sm">
                    <span className="text-gray-500">Số môn: </span><span className="font-bold">{semData.length}</span>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-sm">
                    <span className="text-gray-500">Tổng tín chỉ: </span><span className="font-bold text-red-600">{totalTinchi}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {semData.map(mon => (
                    <div key={mon.maphancong} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`px-5 py-4 border-b border-gray-50 border-l-4 ${mon.color.split(" ").find(c=>c.startsWith("border-")) ?? "border-red-400"}`}>
                        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 ${mon.color}`}>{mon.mamon}</div>
                        <h3 className="font-bold text-gray-800 text-sm">{mon.tenmon}</h3>
                        <p className="text-xs text-gray-500 mt-1">👤 {mon.giangvien}</p>
                      </div>
                      <div className="px-5 py-3 flex justify-between text-xs text-gray-500 border-b border-gray-50">
                        <span>📚 {mon.sotinchi} tín chỉ</span>
                        <span className="font-medium text-gray-700">{mon.scheduleItems.length} buổi/tuần</span>
                      </div>
                      <div className="px-5 py-3 space-y-2">
                        {mon.scheduleItems.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">Chưa xếp lịch</p>
                        ) : mon.scheduleItems.map(lh => (
                          <div key={lh.malichhoc} className="flex items-start gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${mon.color}`}>{lh.thuLabel}</span>
                            <div>
                              <div className="font-medium text-gray-700">Tiết {lh.tietBatDau}–{lh.tietKetThuc} <span className="text-gray-400">({lh.gioVao}–{lh.gioRa})</span></div>
                              <div className="flex items-center gap-1 text-gray-400 mt-0.5"><MapPin size={9}/> Phòng {lh.phonghoc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
