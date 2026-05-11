"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import {
  SearchBar,
  TableSkeleton,
  EmptyState,
  ConfirmDelete,
  Pagination,
} from "@/components/admin/AdminTable";
import { useThongbao, type ThongbaoRow } from "@/hooks/admin/useThongbao";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { usePhanCong, type PhanCongRow } from "@/hooks/admin/usePhancong";
import { VaiTro } from "@/types";
import styles from "./notification.module.css";

// ─── Form Component ───────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface ParsedContent {
  imageUrl: string | null;
  text: string;
}

function parseNotificationContent(noidung: string): ParsedContent {
  const match = noidung.match(/^\s*\[IMAGE_URL:([^\]]+)\]([\s\S]*)$/i);
  if (match) {
    const imageUrl = match[1].trim();
    let text = match[2];
    if (text.startsWith("\n")) {
      text = text.slice(1);
    } else if (text.startsWith("\r\n")) {
      text = text.slice(2);
    }
    return { imageUrl, text };
  }
  return {
    imageUrl: null,
    text: noidung,
  };
}

function getNotificationStatus(
  ngaytao: string,
  ngayhethan: string | null,
): "Scheduled" | "Expired" | "Active" {
  const now = new Date();
  const formatted = ngaytao.replace(" ", "T");
  const parts = formatted.split("T");
  const [year, month, day] = parts[0].split("-").map(Number);
  const [hours, minutes] = (parts[1] ?? "00:00").split(":").map(Number);
  const pubDate = new Date(year, month - 1, day, hours, minutes);

  if (pubDate > now) return "Scheduled";
  if (ngayhethan) {
    const [eyear, emonth, eday] = ngayhethan.split("-").map(Number);
    const expDate = new Date(eyear, emonth - 1, eday, 23, 59, 59, 999);
    if (expDate < now) return "Expired";
  }
  return "Active";
}

// Format date-time for datetime-local input (YYYY-MM-DDTHH:MM) using literal parsing
const formatDateTimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const formatted = isoString.replace(" ", "T");
  const parts = formatted.split("T");
  const datePart = parts[0];
  const timePart = parts[1]?.slice(0, 5) ?? "00:00";
  return `${datePart}T${timePart}`;
};

// Parse a local datetime string (YYYY-MM-DDTHH:MM) correctly into a literal SQL string
const parseDateTimeLocalLiteral = (localStr: string): string => {
  return localStr.replace("T", " ") + ":00";
};

// ─── Form Component ───────────────────────────────────────────────────────────

function NotificationForm({
  initial,
  lops,
  phancongs,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: Partial<ThongbaoRow>;
  lops: LopRow[];
  phancongs: PhanCongRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const parsed = parseNotificationContent(initial?.noidung ?? "");

  const [form, setForm] = useState({
    tieude: initial?.tieude ?? "",
    noidung: parsed.text,
    imageUrl: parsed.imageUrl ?? "",
    loai: initial?.loai ?? "Chung",
    doituong: initial?.doituong ?? "Tatca",
    malop: initial?.malop ?? "",
    maphancong: initial?.maphancong ?? "",
    ngayhethan: initial?.ngayhethan?.split("T")[0] ?? "",
    ngaytao: initial?.ngaytao ? formatDateTimeLocal(initial.ngaytao) : "",
    ghim: initial?.ghim ?? false,
  });

  const [imageMode, setImageMode] = useState<"upload" | "url">(
    parsed.imageUrl?.startsWith("data:") ? "upload" : "url",
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF,...)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 3MB để tối ưu hóa lưu trữ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setForm((prev) => ({ ...prev, imageUrl: base64Str }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = () => {
    const finalNoidung = form.imageUrl.trim()
      ? `[IMAGE_URL:${form.imageUrl.trim()}]\n${form.noidung}`
      : form.noidung;

    onSubmit({
      tieude: form.tieude,
      noidung: finalNoidung,
      loai: form.loai,
      doituong: form.doituong,
      malop: form.malop,
      maphancong: form.maphancong,
      ngayhethan: form.ngayhethan || null,
      ghim: form.ghim,
      ngaytao: form.ngaytao
        ? parseDateTimeLocalLiteral(form.ngaytao)
        : undefined,
    });
  };

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Tiêu đề thông báo *</label>
          <input
            value={form.tieude}
            onChange={(e) => setForm({ ...form, tieude: e.target.value })}
            placeholder="Nhập tiêu đề ngắn gọn..."
          />
        </div>
        <div className="field">
          <label>Loại thông báo</label>
          <select
            value={form.loai}
            onChange={(e) => setForm({ ...form, loai: e.target.value })}
          >
            <option value="Chung">Chung</option>
            <option value="Khancap">Khẩn cấp</option>
            <option value="Hoctap">Học tập</option>
            <option value="Thoikhoabieu">Thời khóa biểu</option>
            <option value="Diem">Điểm số</option>
            <option value="Baitap">Bài tập</option>
          </select>
        </div>
        <div className="field">
          <label>Ngày hết hạn (Tuỳ chọn)</label>
          <input
            type="date"
            value={form.ngayhethan}
            onChange={(e) => setForm({ ...form, ngayhethan: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Đối tượng nhận</label>
          <select
            value={form.doituong}
            onChange={(e) => setForm({ ...form, doituong: e.target.value })}
          >
            <option value="Tatca">Tất cả</option>
            <option value="GiangVien">Giảng viên</option>
            <option value="SinhVien">Sinh viên</option>
          </select>
        </div>
        <div className="field">
          <label>Gửi cho Lớp (Tuỳ chọn)</label>
          <select
            value={form.malop}
            onChange={(e) => setForm({ ...form, malop: e.target.value })}
          >
            <option value="">-- Tất cả các lớp --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop} ({l.malop})
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Gắn với Mã phân công (Tuỳ chọn)</label>
          <select
            value={form.maphancong}
            onChange={(e) => setForm({ ...form, maphancong: e.target.value })}
          >
            <option value="">-- Không gắn --</option>
            {phancongs.map((p) => (
              <option key={p.maphancong} value={p.maphancong}>
                [{p.maphancong}] {p.monhoc?.tenmon} - {p.giangvien?.hoten} (
                {p.lop?.tenlop})
              </option>
            ))}
          </select>
        </div>

        {/* Hình ảnh đính kèm */}
        <div
          className="field full"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <label style={{ fontWeight: 600, color: "#2D1B14" }}>
            Hình ảnh đính kèm (Tuỳ chọn)
          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
            <button
              type="button"
              className={
                imageMode === "upload" ? "btn-primary" : "btn-secondary"
              }
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                borderRadius: "8px",
              }}
              onClick={() => setImageMode("upload")}
            >
              📁 Tải ảnh lên từ tệp
            </button>
            <button
              type="button"
              className={imageMode === "url" ? "btn-primary" : "btn-secondary"}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                borderRadius: "8px",
              }}
              onClick={() => setImageMode("url")}
            >
              🔗 Nhập đường dẫn ảnh (URL)
            </button>
          </div>

          {imageMode === "upload" ? (
            <div
              style={{
                border: "2px dashed #FFDBB6",
                borderRadius: "12px",
                padding: "24px 16px",
                textAlign: "center",
                background: "#FFFDF9",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() =>
                document.getElementById("img-upload-input")?.click()
              }
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = "#C25450")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = "#FFDBB6")
              }
            >
              <input
                id="img-upload-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  margin: "0 auto 8px",
                  display: "block",
                  color: "#C25450",
                }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span
                style={{ fontSize: "13px", color: "#8B6F5F", fontWeight: 500 }}
              >
                {form.imageUrl.startsWith("data:")
                  ? "✓ Đã tải ảnh lên thành công"
                  : "Nhấp vào đây để chọn ảnh từ máy của bạn"}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#A08070",
                  marginTop: "4px",
                }}
              >
                Hỗ trợ PNG, JPG, WEBP, GIF (Tối đa 3MB)
              </span>
            </div>
          ) : (
            <input
              value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="Ví dụ: https://images.unsplash.com/... hoặc đường dẫn ảnh bất kỳ"
            />
          )}

          {form.imageUrl.trim() && (
            <div
              style={{
                marginTop: "8px",
                background: "#FFFBF2",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #FFDBB6",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#8B6F5F",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Xem trước ảnh đính kèm:
                </span>
                <img
                  src={form.imageUrl.trim()}
                  alt="Xem trước ảnh đính kèm"
                  style={{
                    display: "block",
                    maxHeight: "120px",
                    borderRadius: "8px",
                    border: "1px solid #FFDBB6",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#C25450",
                  border: "1.5px solid #C25450",
                  background: "#FFF0F0",
                }}
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
              >
                🗑️ Gỡ bỏ ảnh
              </button>
            </div>
          )}
        </div>

        {/* Lên lịch phát sóng */}
        <div className="field full">
          <label>Hẹn giờ phát sóng thông báo (Hẹn giờ gửi - Tuỳ chọn)</label>
          <input
            type="datetime-local"
            value={form.ngaytao}
            onChange={(e) => setForm({ ...form, ngaytao: e.target.value })}
          />
          <span
            style={{
              fontSize: "11px",
              color: "#8B6F5F",
              marginTop: "4px",
              display: "block",
            }}
          >
            Để trống để đăng ngay lập tức. Chọn một thời điểm trong tương lai để
            lên lịch phát tự động.
          </span>
        </div>

        <div className="field full">
          <label>Nội dung chi tiết *</label>
          <textarea
            rows={5}
            value={form.noidung}
            onChange={(e) => setForm({ ...form, noidung: e.target.value })}
            placeholder="Nhập nội dung thông báo..."
          />
        </div>
        <div className="field full">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.ghim}
              onChange={(e) => setForm({ ...form, ghim: e.target.checked })}
            />
            Ghim thông báo lên đầu danh sách
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={handleFormSubmit}
          disabled={loading || !form.tieude.trim() || !form.noidung.trim()}
        >
          {loading
            ? "Đang gửi..."
            : initial?.mathongbao
              ? "Cập nhật"
              : "Đăng thông báo"}
        </button>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getLop } = useLop();
  const { getPhanCong } = usePhanCong();
  const { getThongbao, createThongbao, updateThongbao, deleteThongbao } =
    useThongbao();
  const router = useRouter();

  const [list, setList] = useState<ThongbaoRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [phancongs, setPhancongs] = useState<PhanCongRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete" | "view";
    item?: ThongbaoRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getThongbao({
        search,
        loai: filterType,
        doituong: filterTarget,
        trangthai: filterStatus,
        page,
        limit: 12,
      });
      setList(res.data);
      setTotal(res.pagination.total);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [search, filterType, filterTarget, filterStatus, page]);

  useEffect(() => {
    if (!authLoading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
    if (user) {
      loadData();
      getLop({ limit: 100 })
        .then((res) => setLops(res.data))
        .catch(() => {});
      getPhanCong(100)
        .then((data) => setPhancongs(data))
        .catch(() => {});
    }
  }, [user, authLoading, router, loadData]);

  if (authLoading || !user) return null;

  const handleSubmit = async (form: any) => {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updateThongbao(modal.item.mathongbao, form);
      } else {
        await createThongbao(form);
      }
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Lỗi đăng thông báo.");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteThongbao(modal.item.mathongbao);
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  };

  const getLoaiClass = (loai: string) => {
    if (loai === "Khancap") return styles.typeUrgent;
    if (loai === "Hoctap") return styles.typeEvent;
    return styles.typeGeneral;
  };

  const handleTogglePin = async (item: ThongbaoRow) => {
    try {
      await updateThongbao(item.mathongbao, { ghim: !item.ghim });
      loadData();
    } catch (e: any) {
      alert(e.message || "Không thể thay đổi trạng thái ghim.");
    }
  };

  return (
    <DashboardShell pageTitle="Quản lý Thông báo">
      <div className={`animate-fadeInUp ${styles.page}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý Thông báo</h1>
            <p className={styles.subtitle}>
              Phát tin tức, thông báo khẩn cấp đến sinh viên và giảng viên
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Tạo thông báo
          </button>
        </div>

        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm tiêu đề..."
            />
            <select
              className={styles.filterSelect}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả loại --</option>
              <option value="Chung">Chung</option>
              <option value="Khancap">Khẩn cấp</option>
              <option value="Hoctap">Học tập</option>
              <option value="Thoikhoabieu">Thời khóa biểu</option>
              <option value="Diem">Điểm số</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filterTarget}
              onChange={(e) => {
                setFilterTarget(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả đối tượng --</option>
              <option value="Tatca">Tất cả</option>
              <option value="GiangVien">Giảng viên</option>
              <option value="SinhVien">Sinh viên</option>
            </select>
            <select
              className={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="Active">Đang hiệu lực</option>
              <option value="Scheduled">Hẹn giờ phát sóng</option>
              <option value="Expired">Đã hết hạn</option>
            </select>
            {(search || filterTarget || filterType || filterStatus) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterTarget("");
                  setFilterType("");
                  setFilterStatus("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: "40px" }}>
              <TableSkeleton cols={1} rows={3} />
            </div>
          ) : list.length > 0 ? (
            <div className={styles.grid}>
              {list.map((notif) => {
                const parsed = parseNotificationContent(notif.noidung);
                const status = getNotificationStatus(
                  notif.ngaytao,
                  notif.ngayhethan,
                );

                return (
                  <div
                    key={notif.mathongbao}
                    className={`${styles.card} ${notif.ghim ? styles.cardPinned : ""} ${status === "Expired" ? styles.cardExpired : ""}`}
                    onClick={() => setModal({ mode: "view", item: notif })}
                    style={{ cursor: "pointer" }}
                    title="Click để xem toàn bộ nội dung"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: "8px",
                      }}
                    >
                      <span
                        className={`${styles.cardType} ${getLoaiClass(notif.loai)}`}
                      >
                        {notif.loai}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {status === "Active" && (
                          <span
                            className={`${styles.statusBadge} ${styles.statusActive}`}
                          >
                            Đang hiệu lực
                          </span>
                        )}
                        {status === "Scheduled" && (
                          <span
                            className={`${styles.statusBadge} ${styles.statusScheduled}`}
                          >
                            Hẹn giờ gửi
                          </span>
                        )}
                        {status === "Expired" && (
                          <span
                            className={`${styles.statusBadge} ${styles.statusExpired}`}
                          >
                            Đã hết hạn
                          </span>
                        )}
                        {notif.ghim && (
                          <span className={styles.pinIconSmall} title="Đã ghim">
                            📌
                          </span>
                        )}
                      </div>
                    </div>

                    {parsed.imageUrl && (
                      <div className={styles.cardImageWrap}>
                        <img
                          src={parsed.imageUrl}
                          alt={notif.tieude}
                          className={styles.cardImage}
                        />
                      </div>
                    )}

                    <h3 className={styles.cardTitle}>{notif.tieude}</h3>
                    <p className={styles.cardContent}>{parsed.text}</p>

                    <div className={styles.cardFooter}>
                      <div className={styles.cardMeta}>
                        <span className={styles.metaItem}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {notif.admin?.hoten || "Hệ thống"}
                        </span>
                        <span className={styles.metaItem}>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {(() => {
                            const formatted = notif.ngaytao.replace(" ", "T");
                            const parts = formatted.split("T");
                            const [year, month, day] = parts[0].split("-");
                            const timePart = parts[1]?.slice(0, 5) ?? "00:00";
                            return `${day}/${month}/${year} ${timePart}`;
                          })()}
                        </span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMutError("");
                            setModal({ mode: "edit", item: notif });
                          }}
                          title="Sửa"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMutError("");
                            setModal({ mode: "delete", item: notif });
                          }}
                          title="Xoá"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "40px" }}>
              <EmptyState />
            </div>
          )}

          {total > 12 && (
            <div style={{ padding: "20px", borderTop: "1px solid #FFDBB6" }}>
              <Pagination
                page={page}
                total={total}
                limit={12}
                totalPages={Math.ceil(total / 12)}
                onPage={setPage}
              />
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <AdminModal
          title={
            modal.mode === "create"
              ? "Đăng thông báo mới"
              : "Chỉnh sửa thông báo"
          }
          onClose={() => setModal(null)}
        >
          <NotificationForm
            initial={modal.item}
            lops={lops}
            phancongs={phancongs}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá thông báo"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={modal.item.tieude}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={mutating}
          />
          {mutError && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              {mutError}
            </p>
          )}
        </AdminModal>
      )}

      {modal?.mode === "view" &&
        modal.item &&
        (() => {
          const parsed = parseNotificationContent(modal.item.noidung);
          const status = getNotificationStatus(
            modal.item.ngaytao,
            modal.item.ngayhethan,
          );
          return (
            <AdminModal
              title="Chi tiết thông báo"
              onClose={() => setModal(null)}
              size="md"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    className={`${styles.cardType} ${getLoaiClass(modal.item.loai)}`}
                  >
                    {modal.item.loai}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {status === "Active" && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusActive}`}
                      >
                        Đang hiệu lực
                      </span>
                    )}
                    {status === "Scheduled" && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusScheduled}`}
                      >
                        Hẹn giờ gửi
                      </span>
                    )}
                    {status === "Expired" && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusExpired}`}
                      >
                        Đã hết hạn
                      </span>
                    )}
                    <span style={{ fontSize: "12px", color: "#8B6F5F" }}>
                      Phát sóng:{" "}
                      {(() => {
                        const formatted = modal.item.ngaytao.replace(" ", "T");
                        const parts = formatted.split("T");
                        const [year, month, day] = parts[0].split("-");
                        const timePart = parts[1]?.slice(0, 5) ?? "00:00";
                        return `${day}/${month}/${year} ${timePart}`;
                      })()}{" "}
                      bởi{" "}
                      <strong>{modal.item.admin?.hoten || "Hệ thống"}</strong>
                    </span>
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#2D1B14",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {modal.item.tieude}
                </h2>

                {parsed.imageUrl && (
                  <div style={{ width: "100%" }}>
                    <img
                      src={parsed.imageUrl}
                      alt={modal.item.tieude}
                      className={styles.attachedImage}
                    />
                  </div>
                )}

                <div
                  style={{
                    background: "#FFF0CD",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#5D4037",
                    border: "1px solid #FFDBB6",
                  }}
                >
                  <strong>Đối tượng nhận:</strong>{" "}
                  {modal.item.doituong === "Tatca"
                    ? "Tất cả mọi người"
                    : modal.item.doituong === "GiangVien"
                      ? "Toàn bộ giảng viên"
                      : modal.item.doituong === "SinhVien"
                        ? "Toàn bộ sinh viên"
                        : modal.item.doituong === "Lop"
                          ? `Lớp hành chính: ${modal.item.malop}`
                          : `Lớp học phần: ${modal.item.maphancong}`}
                  {modal.item.ngayhethan && (
                    <span style={{ marginLeft: "12px" }}>
                      · <strong>Hết hạn:</strong>{" "}
                      {(() => {
                        const parts = modal.item.ngayhethan
                          .split("T")[0]
                          .split("-");
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      })()}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#2D1B14",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    background: "#FEFAE3",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1.5px solid #FFDBB6",
                    maxHeight: "40vh",
                    overflowY: "auto",
                  }}
                >
                  {parsed.text}
                </div>
              </div>
              <div
                className="modal-actions"
                style={{ borderTop: "none", marginTop: "12px", paddingTop: 0 }}
              >
                <button className="btn-primary" onClick={() => setModal(null)}>
                  Đóng
                </button>
              </div>
            </AdminModal>
          );
        })()}
    </DashboardShell>
  );
}
