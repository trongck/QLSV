"use client";

import { useEffect, useState } from "react";
import {
  useStudentNotifications,
  Notification,
} from "@/hooks/sinhvien/useStudentNotifications";
import {
  Bell,
  Search,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { formatDate } from "@/lib/utils/date.utils";
import { LOAI_LABEL } from "@/components/student/notifications/notificationConstants";
import { NotificationCard } from "@/components/student/notifications/NotificationCard";
import { NotificationDetailModal } from "@/components/student/notifications/NotificationDetailModal";

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useStudentNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  // Tự động mở thông báo khi được điều hướng từ Quả chuông Dashboard
  useEffect(() => {
    if (notifications.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const selectId = params.get("id");
      if (selectId) {
        const target = notifications.find((n) => n.mathongbao === Number(selectId));
        if (target) {
          setSelectedNotification(target);
          if (!target.dadoc) {
            markAsRead(target.mathongbao);
          }
          // Xóa query param để khi reload không bị mở lại
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    }
  }, [notifications]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const tabs = ["Tất cả", ...Object.values(LOAI_LABEL)];
  const filtered = notifications.filter((n) => {
    const matchTab =
      activeTab === "Tất cả" || LOAI_LABEL[n.loai] === activeTab;
    const matchSearch =
      n.tieude.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.noidung ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });
  const unreadCount = notifications.filter((n) => !n.dadoc).length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <DashboardShell pageTitle="Thông báo">
        <div className="animate-fadeInUp">
        <div className="card p-4 sm:p-8 rounded-[24px]">
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">Thông báo</h1>
                {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-sm font-bold">
                    {unreadCount}
                    </span>
                )}
                </div>
                <p className="text-[var(--color-fg-subtle)]">
                Cập nhật thông báo mới nhất từ nhà trường.
                </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="h-[44px] bg-white border border-[var(--color-border)] rounded-xl px-4 flex items-center gap-3 w-full sm:w-[280px]">
                <Search size={16} className="text-[var(--color-fg-subtle)]" />
                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm"
                />
                </div>

                {/* Mark all read */}
                {unreadCount > 0 && (
                <button
                    onClick={markAllAsRead}
                    className="btn-secondary flex items-center gap-2 h-[44px]"
                    title="Đánh dấu tất cả đã đọc"
                >
                    <CheckCheck size={16} />
                    <span className="text-sm">Đọc tất cả</span>
                </button>
                )}

                {/* Refresh */}
                <button
                onClick={fetchNotifications}
                className="w-[44px] h-[44px] rounded-xl border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-light-peach)] transition"
                title="Làm mới"
                >
                <RefreshCw size={16} />
                </button>
            </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 h-[38px] rounded-xl text-sm font-medium transition ${
                    activeTab === tab
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-light-peach)]"
                }`}
                >
                {tab}
                </button>
            ))}
            </div>

            {/* ── Content ── */}
            {loading ? (
            <div className="flex justify-center py-20 text-[var(--color-fg-subtle)]">
                Đang tải...
            </div>
            ) : error ? (
            <div className="flex justify-center py-20 text-red-500">{error}</div>
            ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--color-fg-subtle)]">
                <Bell size={48} strokeWidth={1.2} />
                <p>Không có thông báo nào.</p>
            </div>
            ) : (
            <div className="space-y-4">
                {filtered.map((item) => (
                  <NotificationCard
                    key={item.mathongbao}
                    item={item}
                    onClick={() => {
                      setSelectedNotification(item);
                      if (!item.dadoc) {
                        markAsRead(item.mathongbao);
                      }
                    }}
                  />
                ))}
            </div>
            )}
        </div>
        </div>

      {/* ── DETAIL MODAL ── */}
      <NotificationDetailModal
        isOpen={selectedNotification !== null}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </DashboardShell>
  );
}
