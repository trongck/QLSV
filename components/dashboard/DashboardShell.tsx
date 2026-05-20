"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { VaiTro } from "@/types";
import { ProfileModal } from "@/components/teacher/ProfileModal";
import { StudentProfileModal } from "@/components/student/ProfileModal";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
  fullWidth?: boolean;
}

export function DashboardShell({ children, pageTitle, fullWidth }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuth();
  const isTeacher = user?.vaitro === VaiTro.GiangVien;
  const isStudent = user?.vaitro === VaiTro.SinhVien;

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
        <DashboardSidebar onProfileClick={isTeacher || isStudent ? () => setProfileOpen(true) : undefined} />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar — tablet & mobile only */}
        <div className="hidden max-lg:block">
          <DashboardTopbar
            title={pageTitle}
            onMenuClick={() => setSidebarOpen(v => !v)}
            onProfileClick={isTeacher || isStudent ? () => setProfileOpen(true) : undefined}
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
    </div>
  );
}

