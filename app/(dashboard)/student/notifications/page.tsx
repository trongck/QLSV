"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Bell, FileText, BookOpen, Clock, Star,
  AlertTriangle, Search, CheckCheck, X, Pin,
} from "lucide-react";
import {
  getStudentNotifications,
  markNotificationRead,
  LOAI_LABEL,
  formatNotifDate,
  parseNotificationContent,
  type ThongBaoItem,
} from "@/services/service/notification.service";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "tatca" | "chuadoc" | "dadoc";

const TABS: { key: Tab; label: string }[] = [
  { key: "tatca", label: "Tất cả" },
  { key: "chuadoc", label: "Chưa đọc" },
  { key: "dadoc", label: "Đã đọc" },
];

// ─── Màu badge theo loại ──────────────────────────────────────────────────────

const LOAI_COLOR: Record<string, { bg: string; text: string }> = {
  Khancap: { bg: "#FEE2E2", text: "#B91C1C" },
  Hoctap: { bg: "#DBEAFE", text: "#1D4ED8" },
  Thoikhoabieu: { bg: "#EDE9FE", text: "#6D28D9" },
  Diem: { bg: "#D1FAE5", text: "#065F46" },
  Tailieu: { bg: "#FFEDD5", text: "#C2410C" },
  Baitap: { bg: "#FEF3C7", text: "#92400E" },
  Chung: { bg: "#F3F4F6", text: "#374151" },
};

function getLoaiColor(loai: string) {
  return LOAI_COLOR[loai] ?? { bg: "#F3F4F6", text: "#374151" };
}

// ─── Icon theo loại ───────────────────────────────────────────────────────────

function NotifIcon({ loai, size = 48 }: { loai: string; size?: number }) {
  const color = getLoaiColor(loai);
  const iconSize = Math.round(size * 0.42);
  const style = {
    width: size, height: size,
    borderRadius: 12,
    background: color.bg,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  };
  const iconStyle = { color: color.text };
  switch (loai) {
    case "Tailieu": return <div style={style}><FileText size={iconSize} style={iconStyle} /></div>;
    case "Hoctap": return <div style={style}><BookOpen size={iconSize} style={iconStyle} /></div>;
    case "Thoikhoabieu": return <div style={style}><Clock size={iconSize} style={iconStyle} /></div>;
    case "Diem": return <div style={style}><Star size={iconSize} style={iconStyle} /></div>;
    case "Khancap": return <div style={style}><AlertTriangle size={iconSize} style={iconStyle} /></div>;
    default: return <div style={style}><Bell size={iconSize} style={iconStyle} /></div>;
  }
}

// ─── Modal chi tiết — dùng Portal để thoát khỏi parent overflow ───────────────

function NotifModal({ item, onClose }: { item: ThongBaoItem; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Khoá scroll trang
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Đóng khi nhấn Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!mounted) return null;

  const nguoiTao = item.admin?.hoten ?? item.giangvien?.hoten ?? "Nhà trường";
  const loaiColor = getLoaiColor(item.loai);
  const parsed = parseNotificationContent(item.noidung);
  const ngayPhat = new Date(item.ngaytao).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const modal = (
    /* Overlay — cố định toàn màn hình, z-index cao */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0,0,0,0.50)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      {/* Dialog */}
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          animation: "fadeInUp 0.2s ease",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Dialog header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F0E8E0",
        }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: "#2d1b14" }}>
            Chi tiết thông báo
          </span>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: "#F5EDE8", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "opacity .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <X size={16} color="#5c3d2e" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>

          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {/* Loại badge */}
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: loaiColor.bg, color: loaiColor.text,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
              {LOAI_LABEL[item.loai] ?? item.loai}
            </span>

            {/* Trạng thái */}
            <span style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0",
            }}>
              Đang hiệu lực
            </span>

            {item.ghim && (
              <span style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: "#FEF3C7", color: "#92400E",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Pin size={11} /> Ghim
              </span>
            )}

            {/* Người tạo + ngày */}
            <span style={{ fontSize: 12, color: "#8b6f5f", marginLeft: "auto" }}>
              Phát sóng: <b>{ngayPhat}</b> bởi <b>{nguoiTao}</b>
            </span>
          </div>

          {/* Tiêu đề */}
          <h2 style={{
            fontSize: 20, fontWeight: 800, color: "#2d1b14",
            lineHeight: 1.4, marginBottom: 16,
          }}>
            {item.tieude}
          </h2>

          {/* Đối tượng + hết hạn */}
          <div style={{
            background: "#FFFBEB", border: "1px solid #FDE68A",
            borderRadius: 10, padding: "10px 16px",
            fontSize: 13, color: "#78350F", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <span>
              <b>Đối tượng nhận:</b>{" "}
              {item.doituong === "Tatca"
                ? "Tất cả mọi người"
                : item.doituong === "SinhVien"
                  ? "Sinh viên"
                  : item.doituong}
              {item.lop?.tenlop ? ` · ${item.lop.tenlop}` : ""}
            </span>
            {item.ngayhethan && (
              <span>
                · <b>Hết hạn:</b>{" "}
                {new Date(item.ngayhethan).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>

          {/* Nội dung trong box */}
          {parsed.imageUrl && (
            <div style={{ marginBottom: 16 }}>
              <img src={parsed.imageUrl} alt={item.tieude} style={{ maxWidth: "100%", borderRadius: 12, display: "block" }} />
            </div>
          )}
          <div style={{
            background: "#FFF8F5", border: "1px solid #F0E8E0",
            borderRadius: 12, padding: "16px 20px",
            fontSize: 14, color: "#3d2b1f", lineHeight: 1.8,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {parsed.text}
          </div>

          {/* Đã đọc lúc */}
          {item.dadoc && item.thoigiandoc && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginTop: 12, fontSize: 12, color: "#059669",
            }}>
              <CheckCheck size={13} />
              Đã đọc lúc {new Date(item.thoigiandoc).toLocaleString("vi-VN")}
            </div>
          )}
        </div>

        {/* ── Footer — nút Đóng ── */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F0E8E0" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", height: 50, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #c25450 0%, #a8443f 100%)",
              color: "#fff", fontWeight: 700, fontSize: 15,
              cursor: "pointer", transition: "opacity .15s",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ─── Card thông báo ───────────────────────────────────────────────────────────

function NotifCard({
  item, onRead, onClick,
}: {
  item: ThongBaoItem;
  onRead: (id: number) => void;
  onClick: (item: ThongBaoItem) => void;
}) {
  const nguoiTao = item.admin?.hoten ?? item.giangvien?.hoten ?? "Nhà trường";
  const loaiColor = getLoaiColor(item.loai);
  const parsed = parseNotificationContent(item.noidung);

  async function handleMarkRead(e: React.MouseEvent) {
    e.stopPropagation();
    if (item.dadoc) return;
    await markNotificationRead(item.mathongbao).catch(() => { });
    onRead(item.mathongbao);
  }

  return (
    <div
      className={`card p-6 rounded-2xl hover:translate-y-[-2px] transition-all cursor-pointer relative ${!item.dadoc ? "border-l-4 border-[var(--color-primary)]" : ""
        }`}
      onClick={() => onClick(item)}
    >
      {item.ghim && (
        <span className="absolute top-3 right-4 text-yellow-500 text-sm">📌</span>
      )}

      <div className="flex items-start gap-5">
        <NotifIcon loai={item.loai} />

        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: loaiColor.bg, color: loaiColor.text,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
              {LOAI_LABEL[item.loai] ?? item.loai}
            </span>
            {!item.dadoc && (
              <span style={{
                padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                background: "var(--color-primary)", color: "#fff",
              }}>
                Mới
              </span>
            )}
          </div>

          <h3 className={`text-base mb-1 truncate ${!item.dadoc ? "font-bold" : "font-semibold"}`}>
            {item.tieude}
          </h3>

          <p className="text-[var(--color-fg-subtle)] text-sm leading-6 line-clamp-2">
            {parsed.text}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-[var(--color-fg-subtle)]">
            <span>{formatNotifDate(item.ngaytao)}</span>
            <span>•</span>
            <span>{nguoiTao}</span>
            {item.dadoc && (
              <>
                <span>•</span>
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCheck size={12} /> Đã đọc
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mark read */}
        {!item.dadoc && (
          <button
            title="Đánh dấu đã đọc"
            onClick={handleMarkRead}
            className="shrink-0 w-8 h-8 rounded-xl bg-[var(--color-light-peach)] flex items-center justify-center hover:bg-[var(--color-primary)] hover:text-white transition"
          >
            <CheckCheck size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page chính ───────────────────────────────────────────────────────────────

export default function StudentNotificationsPage() {
  const [tab, setTab] = useState<Tab>("tatca");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<ThongBaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ThongBaoItem | null>(null);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentNotifications({ tab, search: debouncedSearch, limit: 50 });
      setNotifications(res.data);
    } catch (err: any) {
      setError(err.message ?? "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleRead(id: number) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.mathongbao === id
          ? { ...n, dadoc: true, thoigiandoc: new Date().toISOString() }
          : n
      )
    );
  }

  function handleOpenDetail(item: ThongBaoItem) {
    setSelectedItem({
      ...item,
      dadoc: true,
      thoigiandoc: item.thoigiandoc ?? new Date().toISOString(),
    });
    if (!item.dadoc) {
      markNotificationRead(item.mathongbao).catch(() => { });
      handleRead(item.mathongbao);
    }
  }

  const unreadCount = notifications.filter((n) => !n.dadoc).length;

  return (
    <>
      <div className="animate-fadeInUp">
        <div className="card p-8 rounded-[24px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold mb-2">Thông báo</h1>
              <p className="text-[var(--color-fg-subtle)]">
                Cập nhật thông báo mới nhất từ nhà trường.
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary)] text-white">
                    {unreadCount} chưa đọc
                  </span>
                )}
              </p>
            </div>

            {/* Search */}
            <div className="w-[300px] h-[46px] bg-white border border-[var(--color-border)] rounded-xl px-4 flex items-center gap-3">
              <Search size={17} className="text-[var(--color-fg-subtle)] shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-[var(--color-fg-subtle)] hover:opacity-70">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 h-[42px] rounded-xl text-sm font-medium transition-all ${tab === t.key
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-[var(--color-light-peach)] hover:opacity-80"
                  }`}
              >
                {t.label}
                {t.key === "chuadoc" && unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-xs font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 rounded-2xl animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-12">
              <AlertTriangle size={40} className="mx-auto mb-3 text-red-400" />
              <p className="text-[var(--color-fg-subtle)]">{error}</p>
              <button onClick={fetchData} className="btn-primary mt-4">Thử lại</button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && notifications.length === 0 && (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto mb-4 text-[var(--color-fg-subtle)] opacity-30" />
              <p className="text-[var(--color-fg-subtle)] font-medium">
                {tab === "chuadoc"
                  ? "Bạn đã đọc hết tất cả thông báo! 🎉"
                  : tab === "dadoc"
                    ? "Chưa có thông báo nào đã đọc."
                    : "Không có thông báo nào."}
              </p>
            </div>
          )}

          {/* List */}
          {!loading && !error && notifications.length > 0 && (
            <div className="space-y-4">
              {notifications.map((item) => (
                <NotifCard
                  key={item.mathongbao}
                  item={item}
                  onRead={handleRead}
                  onClick={handleOpenDetail}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal — render qua Portal ra document.body */}
      {selectedItem && (
        <NotifModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
