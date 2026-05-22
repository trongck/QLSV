import React from "react";
import { MapPin, User, Clock } from "lucide-react";
import { LichHoc } from "@/hooks/sinhvien/useStudentSchedule";

interface SubjectDetailPanelProps {
  selectedItem: LichHoc | null;
  onClose: () => void;
}

export function SubjectDetailPanel({ selectedItem, onClose }: SubjectDetailPanelProps) {
  if (!selectedItem) return null;

  return (
    <div className="mb-6 p-6 bg-white rounded-2xl border border-red-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
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
          onClick={onClose}
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
  );
}
