import React from "react";
import { Calendar, CheckCircle, Upload, Eye, BookOpen, BarChart2, Users, FileText } from "lucide-react";
import { Assignment } from "@/hooks/sinhvien/useStudentAssignments";
import { formatDate } from "@/lib/utils/date.utils";

const LOAI_CONFIG: Record<string, { icon: any; color: string }> = {
  Baitap: { icon: BookOpen, color: "bg-purple-100 text-purple-600" },
  Thuchanh: { icon: BarChart2, color: "bg-green-100 text-green-600" },
  Nhom: { icon: Users, color: "bg-orange-100 text-orange-600" },
  Tracnghiem: { icon: FileText, color: "bg-red-100 text-red-600" },
  Doan: { icon: BarChart2, color: "bg-blue-100 text-blue-600" },
};

interface AssignmentCardProps {
  item: Assignment;
  onViewDetails: (item: Assignment) => void;
  onSubmit: (item: Assignment) => void;
  onViewSubmission: (item: Assignment) => void;
}

export function AssignmentCard({
  item,
  onViewDetails,
  onSubmit,
  onViewSubmission,
}: AssignmentCardProps) {
  const config = LOAI_CONFIG[item.loai] || LOAI_CONFIG.Baitap;
  const Icon = config.icon;
  const isPastDue = new Date(item.hannop) < new Date();

  return (
    <div className="bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-6 sm:gap-8 hover:shadow-lg transition-all duration-300 group">
      {/* Icon Section */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${config.color} group-hover:scale-110 transition-transform`}
      >
        <Icon size={32} />
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0 w-full lg:w-auto text-center lg:text-left">
        <h3 className="text-lg font-black text-gray-900 mb-1 break-words">
          {item.tieude}
        </h3>
        <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
          {item.mota || "Không có mô tả chi tiết."}
        </p>
        <span
          className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}
        >
          {item.phancong?.monhoc?.tenmon ?? "Môn học tự do"}
        </span>
      </div>

      {/* Meta Section */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 shrink-0 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 text-left sm:text-center lg:text-left">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
            Hạn nộp
          </p>
          <div className="flex items-center gap-2 text-sm font-bold">
            {isPastDue ? (
              <>
                <Calendar size={14} className="text-red-500 shrink-0" />
                <span className="text-red-500">{formatDate(item.hannop)}</span>
                <span className="text-[10px] bg-red-100 text-red-500 rounded-full px-2 py-0.5 font-black">
                  Hết hạn
                </span>
              </>
            ) : (
              <>
                <Calendar size={14} className="text-red-400 shrink-0" />
                <span className="text-gray-700">{formatDate(item.hannop)}</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
            Giảng viên
          </p>
          <p className="text-sm font-black text-gray-700">
            {item.phancong?.giangvien?.hoten ?? "Hệ thống"}
          </p>
        </div>
      </div>

      {/* Buttons Section */}
      <div className="flex flex-col gap-2 w-full lg:w-52 shrink-0">
        {item.nopbai ? (
          <button
            onClick={() => onViewSubmission(item)}
            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2.5 rounded-xl text-xs font-bold border border-green-200/50 w-full hover:bg-green-100 transition-all"
          >
            <CheckCircle size={14} className="shrink-0 text-green-500" />
            Xem bài đã nộp {item.nopbai.diem !== null ? `— ${item.nopbai.diem}đ` : ""}
          </button>
        ) : null}
        {/* Nộp bài */}
        <button
          onClick={() => onSubmit(item)}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-md w-full ${
            item.nopbai
              ? "bg-[#FFF4F4] text-[#C0392B] border border-[#F2A8A8] hover:bg-[#FFE0E0]"
              : "bg-[#E57373] text-white hover:bg-[#C0392B] shadow-[#F2A8A8]/60"
          }`}
        >
          <Upload size={16} />
          {item.nopbai ? "Nộp lại" : "Nộp bài"}
        </button>
        {/* Xem đề bài */}
        <button
          onClick={() => onViewDetails(item)}
          className="flex items-center justify-center gap-2 bg-white text-[#6B4F43] border border-[#EAD9CB] py-3 rounded-2xl text-sm font-bold hover:bg-[#FFF4F0] transition-all w-full"
        >
          <Eye size={16} />
          Xem đề bài
        </button>
      </div>
    </div>
  );
}
