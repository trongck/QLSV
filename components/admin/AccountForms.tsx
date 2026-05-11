"use client";

import { useState, useCallback, useEffect } from "react";
import { VaiTro, TrangThaiTaiKhoan } from "@/types";
import type { TaiKhoanRow, AccountStats } from "@/hooks/admin/useTaikhoan";

export const ROLE_LABEL: Record<VaiTro, string> = {
  [VaiTro.Admin]: "Quản trị viên",
  [VaiTro.GiangVien]: "Giảng viên",
  [VaiTro.SinhVien]: "Sinh viên",
};
export const ROLE_BADGE: Record<VaiTro, string> = {
  [VaiTro.Admin]: "badge-red",
  [VaiTro.GiangVien]: "badge-blue",
  [VaiTro.SinhVien]: "badge-green",
};

export const STATUS_LABEL: Record<TrangThaiTaiKhoan, string> = {
  [TrangThaiTaiKhoan.HoatDong]: "Hoạt động",
  [TrangThaiTaiKhoan.Khoa]: "Khoá",
};

// ─── Stats Strip ──────────────────────────────────────────────────────────────

export function StatsStrip({ stats }: { stats: AccountStats | null }) {
  const items = [
    { label: "Tổng tài khoản", value: stats?.total ?? "—" },
    { label: "Hoạt động", value: stats?.hoatdong ?? "—" },
    { label: "Đang khoá", value: stats?.khoa ?? "—" },
    { label: "Sinh viên", value: stats?.sinhvien ?? "—" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-2 max-sm:gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white border-[1.5px] border-[#EAD9CB] rounded-2xl p-[14px_18px] flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(194,84,80,0.08)] max-sm:p-[10px_12px]"
        >
          <div className="flex flex-col gap-[1px] min-w-0">
            <span className="text-[22px] font-bold text-[#2D1B14] leading-tight max-sm:text-[18px]">
              {item.value}
            </span>
            <span className="text-xs text-[#8B6F5F] whitespace-nowrap">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Reset Password Form ───────────────────────────────────────────────

interface QuickResetFormProps {
  item: TaiKhoanRow;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function QuickResetForm({
  item,
  onSubmit,
  onCancel,
  loading,
  error,
}: QuickResetFormProps) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const generated = useCallback(() => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setPw(result);
    setConfirm(result);
    setShow(true);
  }, []);

  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <span className="text-sm font-semibold text-[#2D1B14] break-all">
          {item.email}
        </span>
        <span className={`badge ${ROLE_BADGE[item.vaitro as VaiTro] ?? "badge-peach"}`}>
          {ROLE_LABEL[item.vaitro as VaiTro] ?? item.vaitro}
        </span>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Mật khẩu mới</label>
          <div className="relative flex items-center w-full [&_input]:pr-10">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu mới (≥ 6 ký tự)…"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 bg-none border-none cursor-pointer text-[#8B6F5F] flex items-center justify-center p-0 transition-colors duration-150 hover:text-primary"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {show ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="field full">
          <label>Xác nhận mật khẩu</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu…"
            autoComplete="new-password"
            style={mismatch ? { borderColor: "#C25450" } : undefined}
          />
          {mismatch && (
            <span style={{ fontSize: 12, color: "#C25450", marginTop: 2 }}>
              Mật khẩu không khớp
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-1.5 bg-[#FEFAE3] border-[1.5px] border-[#FFDBB6] text-[#6B4F3F] text-[12.5px] font-semibold p-[8px_14px] rounded-xl cursor-pointer mt-2.5 mb-4 transition-all duration-150 hover:bg-[#FFF0CD] hover:border-primary hover:text-primary"
        onClick={generated}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Tạo mật khẩu ngẫu nhiên
      </button>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(pw)}
          disabled={loading || !pw || mismatch}
        >
          {loading ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Account Form ────────────────────────────────────────────────────────

interface EditAccountFormProps {
  item: TaiKhoanRow;
  onSubmit: (d: { trangthai?: string; matkhau?: string }) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function EditAccountForm({
  item,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditAccountFormProps) {
  const [trangthai, setTrangthai] = useState(item.trangthai);
  const [matkhau, setMatkhau] = useState("");

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        <span className="text-sm font-semibold text-[#2D1B14] break-all">
          {item.email}
        </span>
        <span className={`badge ${ROLE_BADGE[item.vaitro as VaiTro] ?? "badge-peach"}`}>
          {ROLE_LABEL[item.vaitro as VaiTro] ?? item.vaitro}
        </span>
      </div>
      <div className="form-grid">
        <div className="field full">
          <label>Trạng thái</label>
          <select
            value={trangthai}
            onChange={(e) => setTrangthai(e.target.value as TrangThaiTaiKhoan)}
          >
            {Object.values(TrangThaiTaiKhoan).map((st) => (
              <option key={st} value={st}>
                {STATUS_LABEL[st]}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Đặt lại mật khẩu (để trống = không đổi)</label>
          <input type="text" style={{ display: "none" }} aria-hidden="true" />
          <input
            type="password"
            value={matkhau}
            onChange={(e) => setMatkhau(e.target.value)}
            placeholder="Mật khẩu mới…"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() =>
            onSubmit({ trangthai, ...(matkhau ? { matkhau } : {}) })
          }
          disabled={loading}
        >
          {loading ? "Đang lưu…" : "Cập nhật"}
        </button>
      </div>
    </>
  );
}

// ─── Bulk Reset Password Form ─────────────────────────────────────────────────

interface BulkResetFormProps {
  count: number;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function BulkResetForm({
  count,
  onSubmit,
  onCancel,
  loading,
  error,
}: BulkResetFormProps) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="flex items-start gap-3 p-[12px_16px] bg-[#FFF5F5] border border-[#FBD9D9] rounded-xl mb-5 text-[#6B4F3F] text-[13.5px] leading-relaxed [&_svg]:shrink-0 [&_svg]:mt-0.5 [&_p]:m-0 [&_strong]:text-primary">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C25450"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p>
          Đặt lại mật khẩu cho <strong>{count} tài khoản</strong> đã chọn. Hành
          động này không thể hoàn tác.
        </p>
      </div>
      <div className="form-grid">
        <div className="field full">
          <label>Mật khẩu mới (áp dụng cho tất cả)</label>
          <div className="relative flex items-center w-full [&_input]:pr-10">
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu mới (≥ 6 ký tự)…"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 bg-none border-none cursor-pointer text-[#8B6F5F] flex items-center justify-center p-0 transition-colors duration-150 hover:text-primary"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ẩn" : "Hiện"}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(pw)}
          disabled={loading || pw.length < 6}
        >
          {loading ? "Đang đặt lại…" : `Đặt lại ${count} tài khoản`}
        </button>
      </div>
    </>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

export function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-2.5 p-[12px_20px] rounded-xl shadow-lg text-[13.5px] font-semibold z-[9999] backdrop-blur-md animate-toastSlideIn ${
        type === "success"
          ? "bg-[#D1FAE5]/95 border-[1.5px] border-[#34D399] text-[#065F46]"
          : "bg-[#FEE2E2]/95 border-[1.5px] border-[#F87171] text-[#991B1B]"
      }`}
    >
      {type === "success" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {message}
    </div>
  );
}
