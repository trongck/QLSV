import React from "react";
import { Search, Plus, FileText, Clock, Loader2 } from "lucide-react";
import { Note } from "@/hooks/sinhvien/useStudentNotes";
import { formatDate } from "@/lib/utils/date.utils";
import { MOOD_LABELS } from "./NoteConstants";

interface NoteSidebarProps {
  notes: Note[];
  selectedId: number | null;
  onSelectNote: (note: Note) => void;
  onAddClick: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  loading: boolean;
}

export const NoteSidebar: React.FC<NoteSidebarProps> = ({
  notes,
  selectedId,
  onSelectNote,
  onAddClick,
  searchQuery,
  onSearchChange,
  loading,
}) => {
  return (
    <div className="note-sidebar">
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Nhật ký học tập</h1>
          <button
            onClick={onAddClick}
            className="p-2 bg-[#E57373] text-white rounded-lg hover:bg-[#d32f2f] transition shadow-md active:scale-95"
            title="Thêm nhật ký"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm nhật ký..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl border-none text-sm focus:ring-2 focus:ring-red-100 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2 text-gray-400 text-sm">
            <FileText size={36} strokeWidth={1.2} />
            <span>Chưa có nhật ký nào</span>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.manhatky}
              onClick={() => onSelectNote(note)}
              className={`p-4 cursor-pointer border-b border-gray-50 transition-all ${
                selectedId === note.manhatky
                  ? "bg-red-50 border-r-4 border-red-500"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  {note.tamtrang && (
                    <span className="text-xs">{MOOD_LABELS[note.tamtrang]}</span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
                  <Clock size={9} />
                  {formatDate(note.ngaytao).split(",")[0]}
                </span>
              </div>

              {/* Title */}
              <h3
                className={`font-bold text-sm mb-1 truncate ${
                  selectedId === note.manhatky ? "text-red-700" : "text-gray-800"
                }`}
              >
                {note.tieude || "Không có tiêu đề"}
              </h3>

              {/* Preview */}
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {note.noidung || "Chưa có nội dung..."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
