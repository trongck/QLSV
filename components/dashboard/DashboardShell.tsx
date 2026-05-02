"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar, DashboardTopbar } from "./DashboardSidebar";
import styles from "./DashboardShell.module.css";
import sidebarStyles from "./DashboardLayout.module.css";

interface DashboardShellProps {
  children: React.ReactNode;
  pageTitle: string;
}

export function DashboardShell({ children, pageTitle }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className={styles.shell}>
      {/* Overlay (tablet/mobile) */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <div
        data-sidebar
        className={`${sidebarStyles.sidebar} ${sidebarOpen ? sidebarStyles.open : ""}`}
      >
        <DashboardSidebar />
      </div>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar — tablet & mobile only */}
        <div className={styles.topbarWrap}>
          <DashboardTopbar
            title={pageTitle}
            onMenuClick={() => setSidebarOpen(v => !v)}
          />
        </div>

        {/* Page content */}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
