"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { VaiTro } from "@/types";
import { ProfileModal } from "@/components/teacher/ProfileModal";
import { StudentProfileModal } from "@/components/student/ProfileModal";
import { AdminProfileModal } from "@/components/admin/AdminProfileModal";
import { ChangePasswordModal } from "@/components/dashboard/ChangePasswordModal";
import { NotificationBell } from "@/components/student/NotificationBell";
import { ProfilePopover } from "@/components/student/ProfilePopover";
import { apiFetch } from "@/services/service/auth/auth.service";

async function fetchStudentDashboardNotifications() {
  const res = await apiFetch("/api/student/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard data");
  const json = await res.json();
  const dashData = json.data ?? json;
  const rawNotifications = dashData.thongBaoGanDay ?? [];
  const bells = rawNotifications.map((tb: any) => ({
    mathongbao: tb.mathongbao,
    tieude: tb.tieude,
    noidung: tb.noidung,
    loai: tb.loai,
    dadoc: tb.dadoc ?? false,
    ngaytao: tb.ngaytao,
  }));
  const unreadCount = bells.filter((n: any) => !n.dadoc).length;
  return { bells, unreadCount };
}

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
  fullWidth?: boolean;
}

// ─── Shared desktop profile dropdown (teacher & admin) ────────────────────────

function DesktopProfileDropdown({
  user,
  roleLabel,
  rolePrefix,
  isOpen,
  onToggle,
  onOpenProfile,
  onOpenChangePass,
  onLogout,
}: {
  user: any;
  roleLabel: string;
  rolePrefix: string;
  isOpen: boolean;
  onToggle: () => void;
  onOpenProfile: () => void;
  onOpenChangePass: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="relative">
      <div
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onToggle}
      >
        <div className="w-[34px] h-[34px] rounded-full bg-[#FFF2EB] text-[#8B6F5F] flex items-center justify-center shrink-0 border border-[#EAD9CB] overflow-hidden font-bold text-sm">
          {user?.hoten?.charAt(0) || "?"}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[13px] font-semibold text-[#2D1B14]">
            {rolePrefix} {user?.hoten || "—"}
          </span>
          <span className="text-[11px] text-[#8B6F5F]">{roleLabel}</span>
        </div>
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <>
          {/* Click-away */}
          <div className="fixed inset-0 z-[48]" onClick={onToggle} />
          <div className="absolute top-[48px] right-0 w-[220px] bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-[49] flex flex-col animate-scaleUp">
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
              onClick={() => { onOpenProfile(); onToggle(); }}
            >
              Thông tin cá nhân
            </button>
            <button
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
              onClick={() => { onOpenChangePass(); onToggle(); }}
            >
              Thay đổi mật khẩu
            </button>
            <hr className="border-gray-100 my-1.5" />
            <button
              className="w-full text-left px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
              onClick={() => { onLogout(); onToggle(); }}
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function DashboardShell({ children, pageTitle, fullWidth }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);

  const { user, logout } = useAuth();
  const isTeacher = user?.vaitro === VaiTro.GiangVien;
  const isStudent = user?.vaitro === VaiTro.SinhVien;
  const isAdmin = user?.vaitro === VaiTro.Admin;

  // ── Student notifications ──────────────────────────────────────────────────
  const [bellNotifications, setBellNotifications] = useState<any[]>([]);
  const [unreadBellCount, setUnreadBellCount] = useState(0);

  useEffect(() => {
    if (isStudent && user) {
      fetchStudentDashboardNotifications()
        .then(({ bells, unreadCount }) => {
          setBellNotifications(bells);
          setUnreadBellCount(unreadCount);
        })
        .catch(err => console.error("Failed to fetch student notifications:", err));
    }
  }, [isStudent, user]);

  useEffect(() => {
    if (!isStudent) return;

    const handleRead = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.mathongbao === "number") {
        setBellNotifications(prev =>
          prev.map(n => (n.mathongbao === detail.mathongbao ? { ...n, dadoc: true } : n))
        );
        setUnreadBellCount(c => Math.max(0, c - 1));
      }
    };

    const handleReadAll = () => {
      setBellNotifications(prev => prev.map(n => ({ ...n, dadoc: true })));
      setUnreadBellCount(0);
    };

    window.addEventListener("student-notification-read", handleRead as EventListener);
    window.addEventListener("student-notification-read-all", handleReadAll);

    return () => {
      window.removeEventListener("student-notification-read", handleRead as EventListener);
      window.removeEventListener("student-notification-read-all", handleReadAll);
    };
  }, [isStudent]);

  const handleStudentMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (json.success) {
        setBellNotifications(prev => prev.map(n => ({ ...n, dadoc: true })));
        setUnreadBellCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Teacher notifications ──────────────────────────────────────────────────
  const [teacherBells, setTeacherBells] = useState<any[]>([]);
  const [teacherUnread, setTeacherUnread] = useState(0);

  useEffect(() => {
    if (isTeacher && user) {
      apiFetch("/api/giangvien/notifications?limit=5")
        .then(res => res.json())
        .then(json => {
          if (json.success && json.data) {
            setTeacherBells(json.data.slice(0, 5));
            setTeacherUnread(json.data.filter((n: any) => !n.dadoc).length);
          }
        })
        .catch(err => console.error("Failed to fetch teacher notifications:", err));
    }
  }, [isTeacher, user]);

  const handleTeacherMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (json.success) {
        setTeacherBells(prev => prev.map(n => ({ ...n, dadoc: true })));
        setTeacherUnread(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Shared ────────────────────────────────────────────────────────────────
  const handleLogout = () => setLogoutConfirmOpen(true);
  const confirmLogout = () => logout();

  // Close sidebar on outside click
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

  // Shared topbar bell data (mobile uses student data; teacher mobile uses DashboardTopbar which only shows bell for SinhVien)
  const topbarBells = isStudent ? bellNotifications : isTeacher ? teacherBells : [];
  const topbarUnread = isStudent ? unreadBellCount : isTeacher ? teacherUnread : 0;
  const topbarMarkAllRead = isStudent ? handleStudentMarkAllRead : isTeacher ? handleTeacherMarkAllRead : async () => { };

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
            unreadBellCount={topbarUnread}
            bellNotifications={topbarBells}
            onMarkAllRead={topbarMarkAllRead}
          />
        </div>

        {/* Desktop header — Student (NotificationBell + ProfilePopover) */}
        {isStudent && user && (
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 pt-5 pb-0">
            <NotificationBell
              unreadBellCount={unreadBellCount}
              bellNotifications={bellNotifications}
              onMarkAllRead={handleStudentMarkAllRead}
              isOpen={isNotificationOpen}
              onToggle={() => {
                setIsNotificationOpen(v => !v);
                setIsProfilePopoverOpen(false);
              }}
            />
            <ProfilePopover
              user={user}
              isOpen={isProfilePopoverOpen}
              onToggle={() => {
                setIsProfilePopoverOpen(v => !v);
                setIsNotificationOpen(false);
              }}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenChangePass={() => setChangePassOpen(true)}
            />
          </div>
        )}

        {/* Desktop header — Teacher (NotificationBell + profile dropdown) */}
        {isTeacher && user && (
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 pt-5 pb-0">
            <NotificationBell
              unreadBellCount={teacherUnread}
              bellNotifications={teacherBells}
              onMarkAllRead={handleTeacherMarkAllRead}
              isOpen={isNotificationOpen}
              notificationRoute="/teacher/notification"
              onToggle={() => {
                setIsNotificationOpen(v => !v);
                setIsProfilePopoverOpen(false);
              }}
            />
            <DesktopProfileDropdown
              user={user}
              roleLabel="Giảng viên"
              rolePrefix="GV."
              isOpen={isProfilePopoverOpen}
              onToggle={() => {
                setIsProfilePopoverOpen(v => !v);
                setIsNotificationOpen(false);
              }}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenChangePass={() => setChangePassOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* Desktop header — Admin (profile dropdown only) */}
        {isAdmin && user && (
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 pt-5 pb-0">
            <DesktopProfileDropdown
              user={user}
              roleLabel="Quản trị viên"
              rolePrefix=""
              isOpen={isProfilePopoverOpen}
              onToggle={() => setIsProfilePopoverOpen(v => !v)}
              onOpenProfile={() => setProfileOpen(true)}
              onOpenChangePass={() => setChangePassOpen(true)}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* Page content */}
        <div className={`flex-1 w-full ${fullWidth ? "p-0" : "p-[28px_32px] max-w-[1200px] m-[0_auto] max-lg:p-[20px_20px_32px] max-sm:p-[16px_16px_40px]"}`}>
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

      {/* Logout Confirmation Modal */}
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