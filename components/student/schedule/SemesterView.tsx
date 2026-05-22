import React from "react";
import { Layers, BookOpen, User, Clock, MapPin } from "lucide-react";
import { SemesterSubject } from "@/hooks/sinhvien/useStudentSchedule";
import { getColor } from "./scheduleConstants";

interface SemesterViewProps {
  semesterData: SemesterSubject[];
}

export function SemesterView({ semesterData }: SemesterViewProps) {
  if (semesterData.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-gray-400 gap-3 bg-white rounded-2xl border border-gray-100">
        <Layers size={48} strokeWidth={1} />
        <p className="text-sm">Không có môn học trong học kỳ này</p>
      </div>
    );
  }

  return (
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
  );
}
