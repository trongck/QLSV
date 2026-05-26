"use client";

import { useState } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Đã xảy ra lỗi khi thay đổi mật khẩu.");

      setSuccessMsg("Thay đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => { onClose(); setErrorMsg(""); setSuccessMsg(""); }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full text-sm px-10 py-2.5 border border-[#EAD9CB] rounded-xl outline-none focus:border-[#C25450] transition-colors bg-white placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FFFAF7] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EAD9CB] animate-fadeInUp">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 bg-[#FFFAF7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C25450] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2D1B14] m-0 leading-tight">Thay đổi mật khẩu</h3>
              <p className="text-xs text-[#8B6F5F] m-0 mt-0.5">Đảm bảo an toàn cho tài khoản hệ thống của bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 mt-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-4" autoComplete="off">

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-2.5 rounded-xl font-medium animate-fadeInUp">
               {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-2.5 rounded-xl font-medium animate-fadeInUp">
               {successMsg}
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#2D1B14]">Mật khẩu hiện tại</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><LockIcon /></span>
              <input
                type={showOld ? "text" : "password"}
                className={inputClass}
                placeholder="Nhập mật khẩu cũ"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowOld(!showOld)} disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5 rounded">
                {showOld ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#2D1B14]">Mật khẩu mới</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><LockIcon /></span>
              <input
                type={showNew ? "text" : "password"}
                className={inputClass}
                placeholder="Tối thiểu 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5 rounded">
                {showNew ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#2D1B14]">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><LockIcon /></span>
              <input
                type={showConfirm ? "text" : "password"}
                className={inputClass}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5 rounded">
                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm border border-[#EAD9CB] text-[#6B4F43] hover:bg-[#FFF2EB] rounded-xl font-medium transition-colors disabled:opacity-50 bg-white"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-sm bg-[#C25450] hover:bg-[#A9433F] text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}