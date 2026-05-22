import React from "react";
import { Calendar as CalendarIcon, User, Clock, MapPin } from "lucide-react";
import { LichHoc } from "@/hooks/sinhvien/useStudentSchedule";
import { DAYS, TIET_SLOTS, getColor } from "./scheduleConstants";
import { addDays, formatDateShort } from "@/lib/utils/date.utils";

interface WeekViewProps {
  weekData: LichHoc[];
  weekStart: Date;
  selectedItem: LichHoc | null;
  onSelectItem: (lh: LichHoc) => void;
}

export function WeekView({
  weekData,
  weekStart,
  selectedItem,
  onSelectItem,
}: WeekViewProps) {
  const weekDates = DAYS.map((d, i) => ({
    ...d,
    date: addDays(weekStart, i),
    isToday: addDays(weekStart, i).toDateString() === new Date().toDateString(),
  }));

  if (weekData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-col items-center py-20 text-gray-400 gap-3">
          <CalendarIcon size={48} strokeWidth={1} />
          <p className="text-sm">Không có lịch học trong học kỳ này</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                          onClick={() => onSelectItem(lh)}
                          className={`p-1.5 rounded-lg border text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 mb-0.5 ${getColor(lh.maphancong)} ${selectedItem?.malichhoc === lh.malichhoc ? "ring-2 ring-red-400 shadow-md" : ""}`}
                          style={{ height: "calc(100% - 2px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                        >
                          <div className="font-bold text-[11px] leading-tight line-clamp-2">
                            {lh.phancong?.monhoc?.tenmon ?? "Môn học"}
                          </div>

                          {lh.tietketthuc - lh.tietbatdau >= 1 && (
                            <div className="flex-1 flex flex-col justify-start py-1 gap-1 text-[9px] opacity-90 leading-tight select-none">
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

                              {lh.phancong?.giangvien?.hoten && (
                                <div className="flex items-center gap-1 font-bold text-slate-700">
                                  <User size={8} className="shrink-0 text-blue-500" />
                                  <span className="truncate">GV: {lh.phancong.giangvien.hoten}</span>
                                </div>
                              )}

                              {lh.tietketthuc - lh.tietbatdau >= 2 && lh.phancong?.giangvien?.magv && (
                                <div className="text-[9px] text-gray-500 font-medium ml-3">
                                  Mã GV: <span className="font-bold">{lh.phancong.giangvien.magv}</span>
                                </div>
                              )}

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
    </div>
  );
}
