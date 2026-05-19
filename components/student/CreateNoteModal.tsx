"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText } from "lucide-react";

export interface CreateNoteResult {
  tieude: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: CreateNoteResult) => void;
}

export default function CreateNoteModal({ open, onClose, onConfirm }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tieude, setTieude] = useState("Nhật ký mới");

  // Mount check — avoid SSR errors with createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTieude("Nhật ký mới");
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({ tieude: tieude.trim() || "Nhật ký mới" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-[420px] overflow-hidden transform scale-100 transition-all duration-300 border border-gray-100 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-2xl text-[#E57373]">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Tạo nhật ký mới</h2>
              <p className="text-xs text-gray-400">Ghi lại nhật ký học tập của bạn</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
              Tiêu đề nhật ký
            </label>
            <input
              type="text"
              value={tieude}
              onChange={(e) => setTieude(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tiêu đề nhật ký..."
              className="w-full px-4 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200/80 rounded-2xl text-base text-gray-800 font-semibold outline-none focus:bg-white focus:border-[#E57373] focus:ring-4 focus:ring-[#E57373]/10 transition-all duration-200"
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98]"
          >
            Huỷ
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-[#E57373] text-white text-sm font-semibold hover:bg-[#d32f2f] hover:shadow-lg hover:shadow-rose-100 transition-all duration-200 active:scale-[0.98]"
          >
            Tạo nhật ký
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
