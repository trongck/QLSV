import React from "react";
import { FileText } from "lucide-react";
import { Assignment } from "@/hooks/sinhvien/useStudentAssignments";
import { formatDate } from "@/lib/utils/date.utils";
import { resolveFileUrl, extractFileName, getFileType } from "@/lib/utils/file.utils";

interface AssignmentViewerModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  onClose: () => void;
}

export function AssignmentViewerModal({
  isOpen,
  assignment,
  onClose,
}: AssignmentViewerModalProps) {
  if (!isOpen || !assignment) return null;

  const fileUrl = assignment.filedinh ? resolveFileUrl(assignment.filedinh) : "";
  const fileName = assignment.filedinh ? extractFileName(assignment.filedinh, "tai-lieu-dinh-kem") : "";
  const fileType = fileUrl ? getFileType(fileUrl) : "other";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start shrink-0 bg-gray-50/20">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-600">
              {assignment.phancong?.monhoc?.tenmon ?? "Bài tập tự do"}
            </span>
            <h2 className="text-2xl font-black text-gray-900 mt-2">
              {assignment.tieude}
            </h2>
            <p className="text-gray-400 text-xs mt-1">
              Giảng viên: <strong className="text-gray-700">{assignment.phancong?.giangvien?.hoten ?? "Hệ thống"}</strong> | Hạn nộp: <strong className="text-red-500">{formatDate(assignment.hannop)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          <div>
            <h4 className="text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
              Mô tả đề bài
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              {assignment.mota || "Không có mô tả chi tiết."}
            </p>
          </div>

          {/* File đề bài đính kèm */}
          <div>
            <h4 className="text-xs text-gray-400 uppercase font-black tracking-widest mb-3">
              Tài liệu đính kèm
            </h4>
            {assignment.filedinh ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <FileText className="text-red-500 shrink-0" size={24} />
                    <div className="truncate">
                      <p className="text-sm font-black text-gray-900 truncate max-w-xs md:max-w-md" title={fileName}>
                        {fileName}
                      </p>
                      <p className="text-xs text-gray-400">Tài liệu học phần</p>
                    </div>
                  </div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-md"
                  >
                    Mở trong tab mới
                  </a>
                </div>

                {/* Inline PDF / Image / Doc Previewer */}
                {fileType === "pdf" ? (
                  <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                    <iframe
                      src={`${fileUrl}#toolbar=0`}
                      className="w-full h-[450px] border-none"
                      title="Assignment PDF Viewer"
                    />
                  </div>
                ) : fileType === "image" ? (
                  <div className="border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 flex justify-center">
                    <img
                      src={fileUrl}
                      alt="Attached Assignment Material"
                      className="max-h-[400px] object-contain rounded-xl shadow-md"
                    />
                  </div>
                ) : fileType === "doc" ? (
                  <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                      className="w-full h-[500px] border-none"
                      title="Assignment Document Viewer"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-[2rem] border border-dashed text-gray-400">
                    <p className="text-sm font-medium italic">Không hỗ trợ xem trước trực tiếp định dạng file này. Vui lòng bấm "Mở trong tab mới" để xem và tải về.</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Bài tập này không đính kèm file tài liệu.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end shrink-0 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
