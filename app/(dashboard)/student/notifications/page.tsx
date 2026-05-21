"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import {
  Bell,
  FileText,
  Search,
  CheckCheck,
  RefreshCw,
  Clock,
  Pencil,
  Pin,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { parseNotificationContent } from "@/components/admin/NotificationForms";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  mathongbao: number;
  tieude: string;
  noidung: string;
  loai: string;
  doituong: string;
  ghim: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  dadoc: boolean;
  thoigiandoc: string | null;
  dacapnhat: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const LOAI_LABEL: Record<string, string> = {
  Chung: "Chung",
  Hoctap: "Học tập",
  Thoikhoabieu: "Thời khoá biểu",
  Diem: "Điểm",
  Baitap: "Bài tập",
  Tailieu: "Tài liệu",
  Khancap: "Khẩn cấp",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function StudentNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Tất cả");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  // ── Fetch từ API ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sinhvien/notifications");
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setNotifications(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Đánh dấu 1 thông báo đã đọc ────────────────────────────────────────────
  const markAsRead = async (mathongbao: number) => {
    await apiFetch("/api/sinhvien/notifications", {
      method: "PATCH",
      body: JSON.stringify({ mathongbao }),
    });
    setNotifications((prev) =>
      prev.map((n) =>
        n.mathongbao === mathongbao ? { ...n, dadoc: true } : n
      )
    );
  };

  // ── Đánh dấu tất cả đã đọc ──────────────────────────────────────────────────
  const markAllAsRead = async () => {
    await apiFetch("/api/sinhvien/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, dadoc: true })));
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const tabs = ["Tất cả", ...Object.values(LOAI_LABEL)];
  const filtered = notifications.filter((n) => {
    const matchTab =
      activeTab === "Tất cả" || LOAI_LABEL[n.loai] === activeTab;
    const matchSearch =
      n.tieude.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.noidung.toLowerCase().includes(searchQuery.toLowerCase());
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
                {filtered.map((item) => {
                  const parsed = parseNotificationContent(item.noidung);
                  return (
                    <div
                        key={item.mathongbao}
                        onClick={() => {
                          setSelectedNotification(item);
                          if (!item.dadoc) {
                            markAsRead(item.mathongbao);
                          }
                        }}
                        className={`card p-6 rounded-2xl transition-all cursor-pointer hover:translate-y-[-2px] ${
                        !item.dadoc
                            ? "border-l-4 border-[var(--color-primary)]"
                            : "opacity-75"
                        }`}
                    >
                        <div className="flex items-start justify-between gap-5">
                        <div className="flex gap-4 flex-1 min-w-0">
                            {/* Icon */}
                            <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                item.loai === "Khancap"
                                ? "bg-red-100 text-red-600"
                                : "bg-[var(--color-light-peach)]"
                            }`}
                            >
                            {item.loai === "Tailieu" ? (
                                <FileText size={20} />
                            ) : (
                                <Bell size={20} />
                            )}
                            </div>
    
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                            {/* Title row */}
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                {item.ghim && (
                                <Pin size={13} className="text-orange-500 shrink-0" />
                                )}
                                <h3
                                className={`text-base font-semibold truncate ${
                                    !item.dadoc ? "text-[var(--color-primary)]" : ""
                                }`}
                                >
                                {item.tieude}
                                </h3>
                                <span className="badge badge-peach text-xs shrink-0">
                                {LOAI_LABEL[item.loai] ?? item.loai}
                                </span>
                                {!item.dadoc && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                            </div>
    
                            {/* Body */}
                            <p className="text-[var(--color-fg-subtle)] leading-6 text-sm line-clamp-2">
                                {parsed.text}
                            </p>

                            {parsed.imageUrl && (
                              <div className="w-full max-w-[200px] h-24 overflow-hidden rounded-xl border border-gray-100 my-2 shrink-0">
                                <img
                                  src={parsed.imageUrl}
                                  alt={item.tieude}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
    
                            {/* Dates */}
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[var(--color-fg-subtle)]">
                                <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Ngày tạo: {formatDate(item.ngaytao)}
                                </span>
                                {item.dacapnhat && (
                                <span className="flex items-center gap-1 text-orange-500 font-medium">
                                    <Pencil size={12} />
                                    Cập nhật: {formatDate(item.ngaycapnhat)}
                                </span>
                                )}
                            </div>
                            </div>
                        </div>
    
                        {/* Đã đọc badge */}
                        {item.dadoc && (
                            <span className="shrink-0 text-xs text-green-600 flex items-center gap-1 font-medium">
                            <CheckCheck size={14} />
                            Đã đọc
                            </span>
                        )}
                        </div>
                    </div>
                  );
                })}
            </div>
            )}
        </div>
        </div>

      {/* ── DETAIL MODAL ── */}
      {selectedNotification && (() => {
        const parsed = parseNotificationContent(selectedNotification.noidung);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedNotification(null)}
            />
            <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp border border-white/20 p-6 md:p-8">
              {/* Category / Pin */}
              <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-peach text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-light-peach)] text-[var(--color-primary)]">
                  {LOAI_LABEL[selectedNotification.loai] ?? selectedNotification.loai}
                </span>
                {selectedNotification.ghim && (
                  <span className="flex items-center gap-1 text-xs text-orange-500 font-bold px-3 py-1 rounded-full bg-orange-50">
                    <Pin size={11} /> Đã ghim
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 leading-snug">
                {selectedNotification.tieude}
              </h2>

              {/* Dates */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-fg-subtle)] border-b border-gray-100 pb-4 mb-6">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Ngày tạo: {formatDate(selectedNotification.ngaytao)}
                </span>
                {selectedNotification.dacapnhat && (
                  <span className="flex items-center gap-1 text-orange-500 font-medium">
                    <Pencil size={12} />
                    Cập nhật: {formatDate(selectedNotification.ngaycapnhat)}
                  </span>
                )}
              </div>

              {/* Content (Full text, allow wrap) */}
              <div className="flex-1 overflow-y-auto max-h-[40vh] text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pr-2 scrollbar-thin">
                {parsed.imageUrl && (
                  <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-w-full">
                    <img
                      src={parsed.imageUrl}
                      alt="Đính kèm"
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                  </div>
                )}
                {parsed.text}
              </div>

              {/* Footer Action */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardShell>
  );
}
