import React from "react";
import { FileText } from "lucide-react";
import { Assignment } from "@/hooks/sinhvien/useStudentAssignments";
import { formatDate } from "@/lib/utils/date.utils";
import { resolveFileUrl, getFileType, extractFileName } from "@/lib/utils/file.utils";

interface SubmissionDetailModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  onClose: () => void;
}

export function SubmissionDetailModal({
  isOpen,
  assignment,
  onClose,
}: SubmissionDetailModalProps) {
  if (!isOpen || !assignment || !assignment.nopbai) return null;

  const nopbai = assignment.nopbai;
  const rawUrl = nopbai.filenop;
  const fileUrl = rawUrl ? resolveFileUrl(rawUrl.split("?name=")[0]) : "";
  const fileName = rawUrl ? extractFileName(rawUrl, "file") : "";
  const fileType = fileUrl ? getFileType(fileUrl) : "other";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0 bg-gray-50/20">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
              Bài đã nộp
            </span>
            <h2 className="text-xl font-black text-gray-900 mt-2">{assignment.tieude}</h2>
            <p className="text-gray-400 text-xs mt-1">
              Nộp lúc: <strong className="text-gray-700">{formatDate(nopbai.thoigiannop)}</strong>
              {nopbai.trenop && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black">
                  Trễ hạn
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Score & Feedback */}
          {nopbai.diem !== null && (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200/60">
              <div className="text-center">
                <p className="text-3xl font-black text-yellow-600">{nopbai.diem}</p>
                <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Điểm</p>
              </div>
              {nopbai.nhanxet && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">
                    Nhận xét của giảng viên
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{nopbai.nhanxet}</p>
                </div>
              )}
            </div>
          )}

          {/* Nội dung nộp */}
          {nopbai.noidungnop && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">
                Nội dung bài nộp
              </p>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {nopbai.noidungnop}
              </div>
            </div>
          )}

          {/* File nộp */}
          {nopbai.filenop && fileUrl && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">File đính kèm</p>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="text-blue-500 shrink-0" size={22} />
                  <p className="text-sm font-bold text-gray-800 truncate" title={fileName}>
                    {fileName}
                  </p>
                </div>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shrink-0"
                >
                  Tải về
                </a>
              </div>
              {fileType === "pdf" ? (
                <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                  <iframe src={`${fileUrl}#toolbar=0`} className="w-full h-[400px] border-none" title="Submitted PDF" />
                </div>
              ) : fileType === "image" ? (
                <div className="border border-gray-100 rounded-[2rem] p-4 bg-gray-50/50 flex justify-center">
                  <img src={fileUrl} alt="Submitted File" className="max-h-[350px] object-contain rounded-xl shadow-md" />
                </div>
              ) : fileType === "doc" ? (
                <div className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-inner bg-gray-100">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
                    className="w-full h-[450px] border-none"
                    title="Submitted Document"
                  />
                </div>
              ) : null}
            </div>
          )}

          {!nopbai.noidungnop && !nopbai.filenop && (
            <p className="text-sm text-gray-400 italic text-center py-6">Bài nộp không có nội dung hay file đính kèm.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
