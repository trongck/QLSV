import React, { useState, useEffect, useRef } from "react";
import { X, CheckCircle, Paperclip, Loader2, Send } from "lucide-react";
import { Assignment } from "@/hooks/sinhvien/useStudentAssignments";
import { formatDate } from "@/lib/utils/date.utils";
import { resolveFileUrl } from "@/lib/utils/file.utils";

interface AssignmentSubmitModalProps {
  isOpen: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onSubmit: (submitText: string, file: File | null, fileUrl: string | null) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export function AssignmentSubmitModal({
  isOpen,
  assignment,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  success,
}: AssignmentSubmitModalProps) {
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [submitFileUrl, setSubmitFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignment) {
      setSubmitText(assignment.nopbai?.noidungnop ?? "");
      setSubmitFile(null);
      setSubmitFileUrl(assignment.nopbai?.filenop ?? null);
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async () => {
    await onSubmit(submitText, submitFile, submitFileUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSubmitFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start shrink-0 bg-[#FFF8F6]">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFE0E0] text-[#C0392B]">
              {assignment.phancong?.monhoc?.tenmon ?? "Bài tập"}
            </span>
            <h2 className="text-lg font-black text-gray-900 mt-2 leading-tight">
              {assignment.tieude}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Hạn nộp: <strong className="text-[#C0392B]">{formatDate(assignment.hannop)}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all font-bold shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status badge nếu đã nộp */}
          {assignment.nopbai && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200/60">
              <CheckCircle size={16} className="text-green-500 shrink-0" />
              <div className="text-xs text-green-700">
                <strong>Đã nộp lần trước</strong> — {new Date(assignment.nopbai.thoigiannop).toLocaleString("vi-VN")}
                {assignment.nopbai.diem !== null && (
                  <span>
                    {" "}
                    — Điểm: <strong>{assignment.nopbai.diem}</strong>
                  </span>
                )}
                {assignment.nopbai.nhanxet && (
                  <p className="mt-0.5 text-green-600 italic">{assignment.nopbai.nhanxet}</p>
                )}
              </div>
            </div>
          )}

          {/* Nội dung trả lời */}
          <div>
            <label className="block text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
              Nội dung bài làm
            </label>
            <textarea
              rows={5}
              value={submitText}
              onChange={(e) => setSubmitText(e.target.value)}
              placeholder="Nhập câu trả lời, ghi chú hoặc mô tả bài làm của bạn..."
              className="w-full p-4 rounded-2xl border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-[#F2A8A8] outline-none resize-none bg-gray-50/50 leading-relaxed"
            />
          </div>

          {/* File đính kèm */}
          <div>
            <label className="block text-xs text-gray-400 uppercase font-black tracking-widest mb-2">
              File bài nộp (tùy chọn)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              onChange={handleFileChange}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#F2A8A8] hover:bg-[#FFF8F6] cursor-pointer transition-all"
            >
              <Paperclip size={18} className="text-[#E57373] shrink-0" />
              <div className="flex-1 min-w-0">
                {submitFile ? (
                  <p className="text-sm font-bold text-gray-800 truncate">{submitFile.name}</p>
                ) : submitFileUrl ? (
                  <p className="text-sm text-gray-500 truncate">
                    File hiện tại:{" "}
                    <a
                      href={resolveFileUrl(submitFileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-gray-700 hover:text-red-500 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {decodeURIComponent(submitFileUrl.split("?name=").pop() ?? "file")}
                    </a>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Nhấn để chọn file đính kèm</p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">PDF, Word, Excel, ảnh, ZIP... tối đa 20MB</p>
              </div>
              {submitFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubmitFile(null);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Errors / Success */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200/60 text-xs text-red-600">
              <X size={14} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200/60 text-xs text-green-700">
              <CheckCircle size={14} className="shrink-0" />
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between gap-3 shrink-0 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!submitText.trim() && !submitFile && !submitFileUrl)}
            className="flex items-center gap-2 px-6 py-3 bg-[#E57373] hover:bg-[#C0392B] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-[#F2A8A8]/40"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSubmitting ? "Đang nộp..." : assignment.nopbai ? "Nộp lại bài" : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
