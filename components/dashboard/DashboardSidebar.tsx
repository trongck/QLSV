"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { VaiTro } from "@/types";

// ─── Nav items per role ────────────────────────────────────────────────────────

const SV_NAV = [
  { href: "/student/dashboard", label: "Tổng quan" },
  { href: "/student/attendance", label: "Điểm danh" },
  { href: "/student/schedule", label: "Lịch học" },
  { href: "/student/grades", label: "Kết quả" },
  { href: "/student/assignments", label: "Bài tập" },
  { href: "/student/test", label: "Bài thi" },
  { href: "/student/messages", label: "Tin nhắn" },
  { href: "/student/notifications", label: "Thông báo" },
  { href: "/student/note", label: "Nhật ký sinh viên" }
]

const GV_NAV = [
  { href: "/teacher/dashboard", label: "Tổng quan" },
  { href: "/teacher/classes", label: "Lớp học" },
  { href: "/teacher/attendance", label: "Điểm danh" },
  { href: "/teacher/students", label: "Sinh viên" },
  { href: "/teacher/grades", label: "Nhập điểm" },
  { href: "/teacher/tasks", label: "Bài tập" },
  { href: "/teacher/exam", label: "Thi trực tuyến" },
  { href: "/teacher/report", label: "Báo cáo và thống kê" },
  { href: "/teacher/message", label: "Tin nhắn" },
  { href: "/teacher/notification", label: "Thông báo" },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/students", label: "Sinh viên" },
  { href: "/admin/teachers", label: "Giảng viên" },
  { href: "/admin/classes", label: "Lớp - Khoa" },
  { href: "/admin/semesters", label: "Học kỳ" },
  { href: "/admin/subjects", label: "Môn học" },
  { href: "/admin/rooms", label: "Phòng học" },
  { href: "/admin/notifications", label: "Thông báo" },
  { href: "/admin/assignments", label: "Phân công" },
  { href: "/admin/schedules", label: "Lịch học" },
  { href: "/admin/accounts", label: "Tài khoản" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function DashboardSidebar({ onProfileClick }: { onProfileClick?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems =
    user?.vaitro === VaiTro.SinhVien
      ? SV_NAV
      : user?.vaitro === VaiTro.GiangVien
        ? GV_NAV
        : ADMIN_NAV;

  const roleLabel =
    user?.vaitro === VaiTro.SinhVien
      ? "Sinh viên"
      : user?.vaitro === VaiTro.GiangVien
        ? "Giảng viên"
        : "Quản trị viên";

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 p-[6px_10px] mb-4">
        <div className="w-[26px] h-[26px] bg-[#C25450] rounded-[7px] flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 3L20 8V16L12 21L4 16V8L12 3Z"
              fill="white"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-[#2D1B14]">Hệ thống quản lý sinh viên</span>
      </div>

      {/* Nav */}
      <ul className="list-none p-0 m-0 flex flex-col gap-0.5 flex-1" role="list">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
            >
              <span className="text-base leading-none" aria-hidden></span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>


    </>
  );
}

import { useState } from "react";

// ─── Top bar (mobile hamburger) ────────────────────────────────────────────────

export function DashboardTopbar({
  title,
  onMenuClick,
  onProfileClick,
  onChangePasswordClick,
  onLogoutClick,
}: {
  title: string;
  onMenuClick: () => void;
  onProfileClick?: () => void;
  onChangePasswordClick?: () => void;
  onLogoutClick?: () => void;
}) {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="hidden max-lg:flex items-center gap-3 p-[0_16px] h-14 bg-white border-b border-[#EAD9CB] sticky top-0 z-[50]">
      <button
        className="bg-none border-none cursor-pointer p-1.5 text-[#6B4F3F] rounded-lg flex items-center hover:bg-[#FFF2EB]"
        onClick={onMenuClick}
        data-menu-btn
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 12h18M3 6h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <h1 className="flex-1 text-[15px] font-bold text-[#2D1B14] m-0">{title}</h1>
      
      <div className="flex items-center gap-2 relative">
        {/* Profile menu dropdown container */}
        <div className="relative">
          <div
            className="w-[32px] h-[32px] rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center cursor-pointer hover:opacity-85 transition-opacity"
            aria-label={`Xin chào, ${user?.hoten}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {user?.hoten?.charAt(0) ?? "?"}
          </div>

          {isDropdownOpen && (
            <>
              {/* Invisible Click-away listener */}
              <div 
                className="fixed inset-0 z-[98] bg-transparent" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-[40px] right-0 w-[180px] bg-white border border-[#EAD9CB] rounded-xl shadow-xl p-1.5 z-[99] flex flex-col animate-scaleUp">
                <div className="px-3 py-1.5 border-b border-[#FAF6F2] mb-1">
                  <p className="text-[11px] font-bold text-fg truncate m-0">{user?.hoten}</p>
                  <p className="text-[9px] text-fg-subtle truncate m-0 mt-0.5">
                    {user?.vaitro === VaiTro.Admin ? "Quản trị" : user?.vaitro === VaiTro.GiangVien ? "Giảng viên" : "Sinh viên"}
                  </p>
                </div>
                
                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors font-medium border-none bg-transparent cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onProfileClick?.();
                  }}
                >
                  Thông tin cá nhân
                </button>

                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors font-medium border-none bg-transparent cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onChangePasswordClick?.();
                  }}
                >
                  Đổi mật khẩu
                </button>

                <hr className="border-[#FAF6F2] my-1" />

                <button
                  className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors font-bold border-none bg-transparent cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogoutClick?.();
                  }}
                >
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick logout button */}
        <button
          className="bg-none border-none cursor-pointer p-1.5 text-[#8B6F5F] rounded-lg flex items-center hover:text-[#C25450]"
          onClick={onLogoutClick}
          aria-label="Đăng xuất nhanh"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

