import React from "react";
import { FileText } from "lucide-react";
import { MOOD_LABELS } from "./NoteConstants";

interface NoteStatsPanelProps {
  totalNotes: number;
  selectedMood: number | null | undefined;
}

export const NoteStatsPanel: React.FC<NoteStatsPanelProps> = ({
  totalNotes,
  selectedMood,
}) => {
  return (
    <div className="w-[280px] bg-[#FDF8F6] p-5 border-l border-gray-100 hidden xl:flex flex-col gap-6">
      {/* Tóm tắt */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <FileText size={14} className="text-red-500" /> Tổng quan
        </h4>
        <div className="space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Tổng nhật ký:</span>
            <span className="font-bold text-gray-800">{totalNotes}</span>
          </div>
        </div>
      </div>

      {/* Tâm trạng */}
      {selectedMood && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50">
          <h4 className="text-sm font-bold text-gray-800 mb-2">Tâm trạng</h4>
          <div className="text-4xl text-center py-2">
            {MOOD_LABELS[selectedMood]}
          </div>
        </div>
      )}
    </div>
  );
};
