"use client";

import { useState } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}



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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full text-sm px-4 py-2.5 border border-[#EAD9CB] rounded-xl outline-none focus:border-[#C25450] transition-colors bg-white placeholder:text-gray-400 disabled:bg-gray-50";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#FFFAF7] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EAD9CB] animate-fadeInUp">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 bg-[#FFFAF7]">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-[#2D1B14] m-0 leading-tight">Thay đổi mật khẩu</h3>
              <p className="text-xs text-[#8B6F5F] m-0 mt-0.5">Đảm bảo an toàn cho tài khoản hệ thống của bạn</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 mt-0.5 text-lg font-bold"
          >
            ✕
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8B6F5F] hover:text-[#C25450] bg-transparent border-none cursor-pointer p-0.5">
                {showOld ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#2D1B14]">Mật khẩu mới</label>
            <div className="relative">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8B6F5F] hover:text-[#C25450] bg-transparent border-none cursor-pointer p-0.5">
                {showNew ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#2D1B14]">Xác nhận mật khẩu mới</label>
            <div className="relative">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8B6F5F] hover:text-[#C25450] bg-transparent border-none cursor-pointer p-0.5">
                {showConfirm ? "Ẩn" : "Hiện"}
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
              {isSubmitting ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}