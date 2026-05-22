import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ProfilePopoverProps {
  user: any;
  isOpen: boolean;
  onToggle: () => void;
  onOpenProfile: () => void;
  onOpenChangePass: () => void;
}

export function ProfilePopover({
  user,
  isOpen,
  onToggle,
  onOpenProfile,
  onOpenChangePass,
}: ProfilePopoverProps) {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogoutClick = () => {
    setIsLogoutConfirmOpen(true);
    onToggle(); // Close popover
  };

  const executeLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <>
      <div className="relative">
        <div
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onToggle}
        >
          <div className="w-[34px] h-[34px] rounded-full bg-[#FFF2EB] text-[#8B6F5F] flex items-center justify-center shrink-0 border border-[#EAD9CB] overflow-hidden">
            {user.anhdaidien ? (
              <img
                src={user.anhdaidien}
                alt={user.hoten}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-5 h-5 text-[#8B6F5F]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[13px] font-semibold text-[#2D1B14]">
              SV. {user?.hoten || "—"}
            </span>
            <span className="text-[11px] text-[#8B6F5F]">
              Sinh viên · {user?.maSinhVien}
            </span>
          </div>
          <svg
            className="w-3 h-3 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute top-[48px] right-0 w-[220px] bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 flex flex-col">
            {/* Nút Thông tin cá nhân */}
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => {
                onOpenProfile();
                onToggle();
              }}
            >
              Thông tin cá nhân
            </button>

            {/* Nút Thay đổi mật khẩu */}
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={() => {
                onOpenChangePass();
                onToggle();
              }}
            >
              Thay đổi mật khẩu
            </button>

            <hr className="border-gray-100 my-1.5" />

            {/* Nút Đăng xuất */}
            <button
              className="w-full text-left px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              onClick={handleLogoutClick}
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Custom Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 p-5 animate-fadeInUp flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-800 m-0">
                Xác nhận đăng xuất
              </h3>
            </div>
            <p className="text-xs text-gray-600 m-0">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeLogout}
                className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
