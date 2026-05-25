"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { VaiTro } from "@/types";
import { ProfileModal } from "@/components/teacher/ProfileModal";
import { StudentProfileModal } from "@/components/student/ProfileModal";
import { AdminProfileModal } from "@/components/admin/AdminProfileModal";
import { ChangePasswordModal } from "@/components/dashboard/ChangePasswordModal";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
  fullWidth?: boolean;
}

export function DashboardShell({ children, pageTitle, fullWidth }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const isTeacher = user?.vaitro === VaiTro.GiangVien;
  const isStudent = user?.vaitro === VaiTro.SinhVien;
  const isAdmin = user?.vaitro === VaiTro.Admin;

  const handleLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    logout();
  };

  // Close sidebar on route change (any click outside)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sidebar]") && !target.closest("[data-menu-btn]")) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-[#FFF2EB]">
      {/* Overlay (tablet/mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#2D1B14]/35 z-[90] backdrop-blur-[2px]"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      
      {/* Sidebar */}
      <div
        data-sidebar
        className={`w-[220px] shrink-0 bg-white border-r border-[#EAD9CB] flex flex-col p-[20px_12px] gap-1 h-screen sticky top-0 overflow-y-auto max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:z-[100] max-lg:h-screen max-lg:transition-transform max-lg:duration-250 max-lg:ease max-lg:shadow-[4px_0_24px_rgba(76,38,24,0.12)] max-sm:w-[200px] ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}`}
      >
        <DashboardSidebar onProfileClick={isTeacher || isStudent || isAdmin ? () => setProfileOpen(true) : undefined} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — tablet & mobile only */}
        <div className="hidden max-lg:block">
          <DashboardTopbar
            title={pageTitle}
            onMenuClick={() => setSidebarOpen(v => !v)}
            onProfileClick={isTeacher || isStudent || isAdmin ? () => setProfileOpen(true) : undefined}
            onChangePasswordClick={() => setChangePassOpen(true)}
            onLogoutClick={handleLogout}
          />
        </div>

        
        {/* Page content */}
        <div className={`flex-1 w-full ${fullWidth ? 'p-0' : 'p-[28px_32px] max-w-[1200px] m-[0_auto] max-lg:p-[20px_20px_32px] max-sm:p-[16px_16px_40px]'}`}>
          {children}
        </div>
      </div>

      {isTeacher && (
        <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
      {isStudent && (
        <StudentProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      )}
      {isAdmin && (
        <AdminProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      )}

      {/* Global Change Password Modal */}
      <ChangePasswordModal isOpen={changePassOpen} onClose={() => setChangePassOpen(false)} />

      {/* Responsive Confirmation Logout Modal */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB] p-6 text-center animate-scaleUp">
            <h3 className="text-base font-bold text-fg mb-2 mt-2">Bạn có chắc chắn muốn đăng xuất?</h3>
            <p className="text-xs text-fg-subtle mb-6">Phiên làm việc hiện tại của bạn trên thiết bị này sẽ được kết thúc.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 text-xs border border-[#EAD9CB] text-fg-muted hover:bg-[#FAF6F2] rounded-xl font-bold transition-all cursor-pointer bg-transparent"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 text-xs bg-primary hover:bg-[#A9433F] text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:scale-95 transition-all border-none cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}