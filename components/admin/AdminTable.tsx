"use client";

// ─── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between p-[14px_20px] border-t border-[#EAD9CB] flex-wrap gap-2.5">
      <span className="text-xs text-[#8B6F5F]">{from}–{to} / {total}</span>
      <div className="flex gap-1">
        <button
          className="min-w-8 h-8 border-[1.5px] border-[#EAD9CB] bg-white rounded-lg text-[13px] color-[#6B4F3F] cursor-pointer font-inherit transition-all duration-120 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#FFF2EB] hover:enabled:border-primary hover:enabled:text-primary"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
        >
          ‹
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 5) {
            if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;
          }
          const isActive = p === page;
          return (
            <button
              key={p}
              className={`min-w-8 h-8 border-[1.5px] rounded-lg text-[13px] cursor-pointer font-inherit transition-all duration-120 flex items-center justify-center ${isActive ? "bg-primary border-primary text-white font-bold" : "border-[#EAD9CB] bg-white text-[#6B4F3F] hover:bg-[#FFF2EB] hover:border-primary hover:text-primary"}`}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          className="min-w-8 h-8 border-[1.5px] border-[#EAD9CB] bg-white rounded-lg text-[13px] color-[#6B4F3F] cursor-pointer font-inherit transition-all duration-120 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[#FFF2EB] hover:enabled:border-primary hover:enabled:text-primary"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ message = "Không có dữ liệu." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 p-[40px_20px] text-[#8B6F5F] text-[13px]">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" stroke="#EAD9CB" strokeWidth="1.5"/>
        <path d="M9 10h.01M15 10h.01M9.5 15a4.5 4.5 0 005 0" stroke="#EAD9CB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <p>{message}</p>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

export function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-px p-[8px_0]">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-[14px_20px] border-b border-[#F5EDE5]">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-3.5 bg-gradient-to-r from-[#F5EDE5] via-[#FFF2EB] to-[#F5EDE5] bg-[length:200%_100%] animate-shimmer rounded-md shrink-0" style={{ width: `${60 + (j * 11) % 40}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Tìm kiếm…" }: SearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[180px] max-w-[320px]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <circle cx="11" cy="11" r="8" stroke="#8B6F5F" strokeWidth="2"/>
        <path d="M21 21l-4.35-4.35" stroke="#8B6F5F" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <input
        type="search"
        name="admin-search-input"
        autoComplete="off"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-[9px_12px_9px_34px] border-[1.5px] border-[#EAD9CB] rounded-xl text-xs text-[#2D1B14] bg-white outline-none font-inherit transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
      />
    </div>
  );
}

// ─── Confirm Delete dialog ────────────────────────────────────────────────────

interface ConfirmDeleteProps {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDelete({ label, onConfirm, onCancel, loading }: ConfirmDeleteProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-[8px_0_4px]">
      <div className="w-[52px] h-[52px] bg-red-100 rounded-full flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#C25450" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-sm text-[#4B2C20] leading-relaxed max-w-[340px] m-0">Bạn có chắc muốn xoá <strong>{label}</strong>? Hành động này không thể hoàn tác.</p>
      <div className="flex gap-2.5 mt-1">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>Huỷ</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Đang xoá…" : "Xoá"}
        </button>
      </div>
    </div>
  );
}