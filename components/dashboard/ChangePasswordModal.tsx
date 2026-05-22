"use client";

import { useState } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { KeyRound, Eye, EyeOff, X, Lock, CheckCircle2, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility states
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không trùng khớp.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại.");
      } else {
        setSuccess("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.");
        // Reset form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Close after a brief delay so they see the success toast
        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2200);
      }
    } catch (err: any) {
      setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAD9CB] flex justify-between items-center bg-[#FFF2EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C25450] rounded-xl text-white">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#2D1B14]">Thay đổi mật khẩu</h2>
              <p className="text-xs text-[#8B6F5F]">Đảm bảo an toàn cho tài khoản hệ thống của bạn</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#F3E5D8] rounded-full text-[#8B6F5F] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2 animate-shake">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-800 text-xs font-semibold rounded-lg border border-green-200 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Mật khẩu cũ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B4F3F] block">Mật khẩu hiện tại</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={15} />
              </div>
              <input
                type={showOld ? "text" : "password"}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#EAD9CB] rounded-xl outline-none focus:border-[#C25450] text-[#2D1B14] transition-colors"
                placeholder="Nhập mật khẩu cũ"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6F5F] hover:text-[#C25450]"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B4F3F] block">Mật khẩu mới</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={15} />
              </div>
              <input
                type={showNew ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#EAD9CB] rounded-xl outline-none focus:border-[#C25450] text-[#2D1B14] transition-colors"
                placeholder="Tối thiểu 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6F5F] hover:text-[#C25450]"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#6B4F3F] block">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={15} />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#EAD9CB] rounded-xl outline-none focus:border-[#C25450] text-[#2D1B14] transition-colors"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B6F5F] hover:text-[#C25450]"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs border border-[#EAD9CB] text-[#6B4F3F] hover:bg-[#FAF6F2] rounded-xl font-bold transition-colors"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs bg-gradient-to-r from-[#C25450] to-[#E57373] text-white font-bold rounded-xl shadow-md shadow-[#C25450]/20 hover:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Cập nhật mật khẩu"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
