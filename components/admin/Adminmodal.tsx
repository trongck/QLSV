"use client";

import { useEffect, useRef } from "react";

interface AdminModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "max-w-[420px]",
  md: "max-w-[580px]",
  lg: "max-w-[760px]",
};

export function AdminModal({ title, onClose, children, size = "md" }: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-[#2D1B14]/45 backdrop-blur-[3px] z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <div className={`bg-white rounded-2xl shadow-[0_20px_60px_rgba(45,27,20,0.18),_0_4px_16px_rgba(45,27,20,0.08)] flex flex-col max-h-[90vh] w-full animate-slideUp overflow-hidden ${SIZE_CLASSES[size]}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-[20px_24px_0] shrink-0 max-[520px]:p-[16px_16px_0]">
          <h2 className="text-[17px] font-bold text-[#2D1B14] m-0">{title}</h2>
          <button className="bg-none border-none cursor-pointer text-[#8B6F5F] p-1.5 rounded-lg flex items-center transition-all duration-150 hover:bg-[#FEE2E2] hover:text-[#C25450]" onClick={onClose} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-[20px_24px_24px] overflow-y-auto flex-1 max-[520px]:p-[16px_16px_20px]">
          {children}
        </div>
      </div>
    </div>
  );
}