"use client";

import styles from "./AdminTable.module.css";

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
    <div className={styles.pagination}>
      <span className={styles.paginInfo}>{from}–{to} / {total}</span>
      <div className={styles.paginBtns}>
        <button
          className={styles.paginBtn}
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
          return (
            <button
              key={p}
              className={`${styles.paginBtn} ${p === page ? styles.paginActive : ""}`}
              onClick={() => onPage(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          className={styles.paginBtn}
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
    <div className={styles.empty}>
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
    <div className={styles.skeletonWrap}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={styles.skeletonCell} style={{ width: `${60 + (j * 11) % 40}%` }} />
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
    <div className={styles.searchWrap}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden className={styles.searchIcon}>
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
        className={styles.searchInput}
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
    <div className={styles.confirmBox}>
      <div className={styles.confirmIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#C25450" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className={styles.confirmText}>Bạn có chắc muốn xoá <strong>{label}</strong>? Hành động này không thể hoàn tác.</p>
      <div className={styles.confirmActions}>
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>Huỷ</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Đang xoá…" : "Xoá"}
        </button>
      </div>
    </div>
  );
}