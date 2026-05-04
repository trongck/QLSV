"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { VaiTro } from "@/types";
import styles from "./DashboardLayout.module.css";

// ─── Nav items per role ────────────────────────────────────────────────────────

const SV_NAV = [
  { href: "/student/dashboard", label: "Tổng quan" },
  { href: "/student/schedule",  label: "Lịch học" },
  { href: "/student/grades",    label: "Kết quả" },
  { href: "/student/tasks",     label: "Bài tập" },
  { href: "/student/messages",  label: "Tin nhắn" },
];

const GV_NAV = [
  { href: "/teacher/dashboard", label: "Tổng quan" },
  { href: "/teacher/classes",   label: "Lớp học" },
  { href: "/teacher/students",  label: "Sinh viên" },
  { href: "/teacher/grades",    label: "Nhập điểm" },
  { href: "/teacher/tasks",     label: "Bài tập" },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard",   label: "Tổng quan" },
  { href: "/admin/students",    label: "Sinh viên" },
  { href: "/admin/teachers",    label: "Giảng viên" },
  { href: "/admin/classes",     label: "Lớp - Khoa" },
  { href: "/admin/accounts",    label: "Tài khoản" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems =
    user?.vaitro === VaiTro.SinhVien  ? SV_NAV    :
    user?.vaitro === VaiTro.GiangVien ? GV_NAV    :
    ADMIN_NAV;

  const roleLabel =
    user?.vaitro === VaiTro.SinhVien  ? "Sinh viên"  :
    user?.vaitro === VaiTro.GiangVien ? "Giảng viên" :
    "Quản trị viên";

  // ⚠️ KHÔNG dùng <nav className={styles.sidebar}> ở đây nữa.
  // DashboardShell đã bọc <div className={styles.sidebar}> bên ngoài rồi —
  // nếu lồng thêm sẽ khiến class .open không hoạt động trên mobile/tablet.
  return (
    <>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3L20 8V16L12 21L4 16V8L12 3Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className={styles.logoText}>Hệ thống quản lý sinh viên</span>
      </div>

      {/* Nav */}
      <ul className={styles.navList} role="list">
        {navItems.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
            >
              <span className={styles.navIcon} aria-hidden></span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* User info + logout */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userInfo}>
          <div className={styles.avatar} aria-hidden>
            {user?.hoten?.charAt(0) ?? "?"}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user?.hoten ?? "—"}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={() => logout()}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </>
  );
}

// ─── Top bar (mobile hamburger) ────────────────────────────────────────────────

export function DashboardTopbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className={styles.topbar}>
      <button
        className={styles.menuBtn}
        onClick={onMenuClick}
        data-menu-btn
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <h1 className={styles.topbarTitle}>{title}</h1>
      <div className={styles.topbarRight}>
        <div className={styles.avatarSm} aria-label={`Xin chào, ${user?.hoten}`}>
          {user?.hoten?.charAt(0) ?? "?"}
        </div>
        <button className={styles.logoutBtnSm} onClick={() => logout()} aria-label="Đăng xuất">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}