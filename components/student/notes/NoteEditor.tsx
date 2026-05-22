import React from "react";
import { Trash2, Calendar, Clock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Note, SaveStatus } from "@/hooks/sinhvien/useStudentNotes";
import { formatDate, isUpdated } from "@/lib/utils/date.utils";
import { MOOD_LABELS } from "./NoteConstants";

interface NoteEditorProps {
  draft: Partial<Note>;
  saveStatus: SaveStatus;
  onDraftChange: (field: keyof Note, value: unknown) => void;
  onDeleteClick: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  draft,
  saveStatus,
  onDraftChange,
  onDeleteClick,
}) => {
  return (
    <div className="note-editor">
      {/* Toolbar */}
      <div className="px-8 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
        <div className="flex items-center gap-4 text-gray-400">
          <button
            onClick={onDeleteClick}
            className="hover:text-red-600 transition"
            title="Xoá nhật ký"
          >
            <Trash2 size={18} />
          </button>
          <div className="h-5 w-[1px] bg-gray-100 mx-1" />
          {/* Mood picker */}
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4, 5] as const).map((m) => (
              <button
                key={m}
                onClick={() => onDraftChange("tamtrang", m)}
                className={`text-base transition hover:scale-125 ${
                  draft.tamtrang === m ? "scale-125" : "opacity-50"
                }`}
                title={`Tâm trạng ${m}`}
              >
                {MOOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Save status */}
        <div className="text-[11px] font-medium italic flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <span className="text-gray-400 flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Đang lưu...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-green-500 flex items-center gap-1">
              <CheckCircle2 size={11} /> Đã lưu
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertCircle size={11} /> Lỗi khi lưu
            </span>
          )}
          {saveStatus === "idle" && (
            <span className="text-gray-300">
              {isUpdated(draft.ngaytao ?? null, draft.ngaycapnhat ?? null)
                ? `Cập nhật: ${formatDate(draft.ngaycapnhat ?? null)}`
                : `Tạo: ${formatDate(draft.ngaytao ?? null)}`}
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto p-5 md:p-10 max-w-4xl mx-auto w-full">
        {/* Title */}
        <input
          type="text"
          value={draft.tieude ?? ""}
          onChange={(e) => onDraftChange("tieude", e.target.value)}
          placeholder="Tiêu đề nhật ký..."
          className="w-full text-3xl font-extrabold text-gray-800 border-none focus:ring-0 mb-6 placeholder:text-gray-200 outline-none bg-transparent"
        />

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-5 mb-6 pb-4 border-b border-gray-50">
          {/* Ngày tạo */}
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <Calendar size={13} className="text-red-400" />
            <span>Ngày tạo: {formatDate(draft.ngaytao ?? null)}</span>
          </div>

          {/* Ngày cập nhật */}
          {isUpdated(draft.ngaytao ?? null, draft.ngaycapnhat ?? null) && (
            <div className="flex items-center gap-2 text-xs text-orange-500 font-semibold">
              <Clock size={13} />
              <span>Cập nhật: {formatDate(draft.ngaycapnhat ?? null)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <textarea
          value={draft.noidung ?? ""}
          onChange={(e) => onDraftChange("noidung", e.target.value)}
          placeholder="Bắt đầu viết nhật ký học tập của bạn tại đây..."
          className="w-full min-h-[500px] border-none focus:ring-0 text-gray-700 leading-loose text-lg resize-none placeholder:text-gray-200 outline-none bg-transparent"
        />
      </div>
    </div>
  );
};
