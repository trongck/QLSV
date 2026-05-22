"use client";

import { useState } from "react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  // State quản lý ẩn/hiện mật khẩu (mắt nhắm/mắt mở)
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // State lưu trữ giá trị người dùng nhập vào các ô dữ liệu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Nếu trạng thái là đóng thì không vẽ gì lên màn hình cả
  if (!isOpen) return null;

  // 🌟 ĐÂY LÀ HÀM SỰ KIỆN - KHI NÀO KẾT NỐI API THÌ SỬA Ở ĐÂY 🌟
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra cơ bản ở giao diện (Luôn luôn cần kể cả khi chưa có API)
    if (newPassword !== confirmPassword) {
      alert("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!");
      return;
    }

    // =================================================================
    // TỚI ĐÂY LÀ KHUNG CHỜ KẾT NỐI API:
    // Sau này khi kết nối bách-end, bạn xóa dòng alert() bên dưới đi
    // và viết đoạn code gọi apiFetch() hoặc axios() vào đây là xong.
    // =================================================================
    
    alert("Khung giao diện hoạt động tốt! (Chưa kết nối API thay đổi vào Cơ sở dữ liệu)");
    
    // Đóng modal sau khi thực hiện xong hành động
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-fadeInUp">
        
        {/* Tiêu đề góc trên của Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">🛡️</span>
            <h3 className="text-sm font-bold text-gray-800 m-0">Đặt lại mật khẩu</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-lg border-none bg-transparent cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Nội dung form nhập liệu */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          
          {/* Thanh thông báo màu hồng cảnh báo */}
          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs px-4 py-2.5 rounded-lg font-medium">
            Vui lòng đặt lại mật khẩu mới
          </div>

          {/* Ô nhập Mật khẩu cũ */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 sm:w-32 shrink-0">Mật khẩu cũ</label>
            <div className="relative flex-1">
              <input 
                type={showOld ? "text" : "password"} 
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 pr-10 transition-colors"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowOld(!showOld)} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-sm"
              >
                {showOld ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Ô nhập Mật khẩu mới */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 sm:w-32 shrink-0">Mật khẩu mới</label>
            <div className="relative flex-1">
              <input 
                type={showNew ? "text" : "password"} 
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 pr-10 transition-colors"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-sm"
              >
                {showNew ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Ô Nhập lại mật khẩu */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 sm:w-32 shrink-0">Nhập lại mật khẩu</label>
            <div className="relative flex-1">
              <input 
                type={showConfirm ? "text" : "password"} 
                className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 pr-10 transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer text-sm"
              >
                {showConfirm ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {/* Cụm 2 nút bấm dưới đáy góc phải */}
          <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-gray-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Thay đổi mật khẩu và email
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}