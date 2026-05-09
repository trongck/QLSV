"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import {
  Pagination,
  SearchBar,
  TableSkeleton,
  EmptyState,
  ConfirmDelete,
} from "@/components/admin/AdminTable";
import {
  getTaiKhoan,
  updateTaiKhoan,
  deleteTaiKhoan,
  getAccountStats,
  bulkAccountAction,
  exportAccountsCSV,
  type TaiKhoanRow,
  type AccountStats,
} from "@/services/admin/taikhoan.service";
import { VaiTro } from "@/types";
import styles from "./accounts.module.css";
import {
  validateTaiKhoanUpdate,
  firstError,
} from "@/lib/validation/admin.validation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  Admin: "Quản trị viên",
  GiangVien: "Giảng viên",
  SinhVien: "Sinh viên",
};
const ROLE_BADGE: Record<string, string> = {
  Admin: "badge-red",
  GiangVien: "badge-blue",
  SinhVien: "badge-green",
};
const STATUS_BADGE: Record<string, string> = {
  HoatDong: "badge-green",
  Khoa: "badge-red",
};
const STATUS_LABEL: Record<string, string> = {
  HoatDong: "Hoạt động",
  Khoa: "Khoá",
};

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: AccountStats | null }) {
  const items = [
    { label: "Tổng tài khoản", value: stats?.total ?? "—" },
    { label: "Hoạt động", value: stats?.hoatdong ?? "—" },
    { label: "Đang khoá", value: stats?.khoa ?? "—" },
    { label: "Sinh viên", value: stats?.sinhvien ?? "—" },
  ];

  return (
    <div className={styles.statsStrip}>
      {items.map((item) => (
        <div key={item.label} className={styles.statCard}>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{item.value}</span>
            <span className={styles.statLabel}>{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Quick Reset Password Modal ───────────────────────────────────────────────

function QuickResetForm({
  item,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  item: TaiKhoanRow;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const generated = useCallback(() => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setPw(result);
    setConfirm(result);
    setShow(true);
  }, []);

  const mismatch = confirm.length > 0 && pw !== confirm;

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className={styles.editInfo}>
        <span className={styles.editEmail}>{item.email}</span>
        <span className={`badge ${ROLE_BADGE[item.vaitro] ?? "badge-peach"}`}>
          {ROLE_LABEL[item.vaitro] ?? item.vaitro}
        </span>
      </div>

      <div className="form-grid">
        <div className="field full">
          <label>Mật khẩu mới</label>
          <div className={styles.pwWrap}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu mới (≥ 6 ký tự)…"
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {show ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="field full">
          <label>Xác nhận mật khẩu</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Nhập lại mật khẩu…"
            autoComplete="new-password"
            style={mismatch ? { borderColor: "#C25450" } : undefined}
          />
          {mismatch && (
            <span style={{ fontSize: 12, color: "#C25450", marginTop: 2 }}>
              Mật khẩu không khớp
            </span>
          )}
        </div>
      </div>

      <button type="button" className={styles.generateBtn} onClick={generated}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
        </svg>
        Tạo mật khẩu ngẫu nhiên
      </button>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(pw)}
          disabled={loading || !pw || mismatch}
        >
          {loading ? "Đang đặt lại…" : "Đặt lại mật khẩu"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Account Form ────────────────────────────────────────────────────────

function EditAccountForm({
  item,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  item: TaiKhoanRow;
  onSubmit: (d: { trangthai?: string; matkhau?: string }) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [trangthai, setTrangthai] = useState(item.trangthai);
  const [matkhau, setMatkhau] = useState("");

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className={styles.editInfo}>
        <span className={styles.editEmail}>{item.email}</span>
        <span className={`badge ${ROLE_BADGE[item.vaitro] ?? "badge-peach"}`}>
          {ROLE_LABEL[item.vaitro] ?? item.vaitro}
        </span>
      </div>
      <div className="form-grid">
        <div className="field full">
          <label>Trạng thái</label>
          <select
            value={trangthai}
            onChange={(e) => setTrangthai(e.target.value)}
          >
            <option value="HoatDong">Hoạt động</option>
            <option value="Khoa">Khoá</option>
          </select>
        </div>
        <div className="field full">
          <label>Đặt lại mật khẩu (để trống = không đổi)</label>
          <input type="text" style={{ display: "none" }} aria-hidden="true" />
          <input
            type="password"
            value={matkhau}
            onChange={(e) => setMatkhau(e.target.value)}
            placeholder="Mật khẩu mới…"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() =>
            onSubmit({ trangthai, ...(matkhau ? { matkhau } : {}) })
          }
          disabled={loading}
        >
          {loading ? "Đang lưu…" : "Cập nhật"}
        </button>
      </div>
    </>
  );
}

// ─── Bulk Reset Password Form ─────────────────────────────────────────────────

function BulkResetForm({
  count,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  count: number;
  onSubmit: (pw: string) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className={styles.bulkInfo}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C25450"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p>
          Đặt lại mật khẩu cho <strong>{count} tài khoản</strong> đã chọn. Hành
          động này không thể hoàn tác.
        </p>
      </div>
      <div className="form-grid">
        <div className="field full">
          <label>Mật khẩu mới (áp dụng cho tất cả)</label>
          <div className={styles.pwWrap}>
            <input
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nhập mật khẩu mới (≥ 6 ký tự)…"
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.pwToggle}
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Ẩn" : "Hiện"}
            >
              {show ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-danger"
          onClick={() => onSubmit(pw)}
          disabled={loading || pw.length < 6}
        >
          {loading ? "Đang đặt lại…" : `Đặt lại ${count} tài khoản`}
        </button>
      </div>
    </>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onDone,
}: {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className={`${styles.toast} ${type === "success" ? styles.toastSuccess : styles.toastError}`}
    >
      {type === "success" ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {message}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalMode = "edit" | "delete" | "quick-reset" | "bulk-reset";

export default function AdminAccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Data
  const [tkList, setTkList] = useState<TaiKhoanRow[]>([]);
  const [stats, setStats] = useState<AccountStats | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [tkLoading, setTkLoading] = useState(true);

  // Selection (bulk)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modal
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: TaiKhoanRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
    },
    [],
  );

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getAccountStats());
    } catch {
      /* ignore */
    }
  }, []);

  const loadTK = useCallback(async () => {
    setTkLoading(true);
    try {
      const res = await getTaiKhoan({
        search,
        vaitro: filterRole,
        trangthai: filterStatus,
        page,
        limit: 15,
      });
      setTkList(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.totalPages);
      setSelected(new Set()); // clear selection on reload
    } catch {
      /* ignore */
    } finally {
      setTkLoading(false);
    }
  }, [search, filterRole, filterStatus, page]);

  useEffect(() => {
    if (user) {
      loadTK();
      loadStats();
    }
  }, [user, loadTK, loadStats]);

  if (loading || !user) return null;

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleEdit(form: { trangthai?: string; matkhau?: string }) {
    const errors = validateTaiKhoanUpdate(form);
    if (errors.length) {
      setMutError(firstError(errors));
      return;
    }
    setMutating(true);
    setMutError("");
    try {
      await updateTaiKhoan(modal!.item!.mataikhoan, form);
      setModal(null);
      showToast("Cập nhật tài khoản thành công!");
      await loadTK();
      await loadStats();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete() {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteTaiKhoan(modal.item.mataikhoan);
      setModal(null);
      showToast("Đã xoá tài khoản thành công!");
      await loadTK();
      await loadStats();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

  async function handleQuickReset(pw: string) {
    if (!modal?.item) return;
    const errors = validateTaiKhoanUpdate({ matkhau: pw });
    if (errors.length) {
      setMutError(firstError(errors));
      return;
    }
    setMutating(true);
    setMutError("");
    try {
      await updateTaiKhoan(modal.item.mataikhoan, { matkhau: pw });
      setModal(null);
      showToast(`Đã đặt lại mật khẩu cho ${modal.item.email}!`);
    } catch (e) {
      setMutError(
        e instanceof Error ? e.message : "Không thể đặt lại mật khẩu.",
      );
    } finally {
      setMutating(false);
    }
  }

  async function handleBulkAction(action: "lock" | "unlock") {
    if (selected.size === 0) return;
    setMutating(true);
    try {
      const res = await bulkAccountAction([...selected], action);
      showToast(
        `Đã ${action === "lock" ? "khoá" : "mở khoá"} ${res.affected} tài khoản!`,
      );
      setSelected(new Set());
      await loadTK();
      await loadStats();
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Lỗi thao tác hàng loạt.",
        "error",
      );
    } finally {
      setMutating(false);
    }
  }

  async function handleBulkReset(pw: string) {
    setMutating(true);
    setMutError("");
    try {
      const res = await bulkAccountAction([...selected], "reset", pw);
      setModal(null);
      showToast(`Đã đặt lại mật khẩu ${res.affected} tài khoản!`);
      setSelected(new Set());
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Lỗi đặt lại mật khẩu.");
    } finally {
      setMutating(false);
    }
  }

  // ── Selection helpers ────────────────────────────────────────────────────────

  const nonAdminRows = tkList.filter((tk) => tk.vaitro !== VaiTro.Admin);
  const allSelected =
    nonAdminRows.length > 0 &&
    nonAdminRows.every((tk) => selected.has(tk.mataikhoan));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(nonAdminRows.map((tk) => tk.mataikhoan)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function handleExport() {
    exportAccountsCSV(tkList);
    showToast("Đã xuất CSV trang hiện tại!");
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardShell pageTitle="Tài khoản">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Tài khoản</h1>
            <p className={styles.pageSub}>
              {total > 0
                ? `${total} tài khoản trong hệ thống`
                : "Kiểm soát truy cập toàn hệ thống"}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.exportBtn}
              onClick={handleExport}
              title="Xuất CSV trang hiện tại"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsStrip stats={stats} />

        {/* Table Card */}
        <section className="card" style={{ padding: 0 }}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm email hoặc mã tài khoản, MSSV…"
            />
            <select
              className={styles.filter}
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả vai trò</option>
              {Object.values(VaiTro).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            <select
              className={styles.filter}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="HoatDong">Hoạt động</option>
              <option value="Khoa">Khoá</option>
            </select>
            {(search || filterRole || filterStatus) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterRole("");
                  setFilterStatus("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className={styles.bulkBar}>
              <span>
                Đã chọn{" "}
                <span className={styles.bulkCount}>{selected.size}</span> tài
                khoản
              </span>
              <div className={styles.bulkSpacer} />
              <button
                className={styles.bulkBtn}
                onClick={() => handleBulkAction("unlock")}
                disabled={mutating}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 019.9-1" />
                </svg>
                Mở khoá
              </button>
              <button
                className={`${styles.bulkBtn} ${styles.bulkBtnDanger}`}
                onClick={() => handleBulkAction("lock")}
                disabled={mutating}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                Khoá
              </button>
              <button
                className={`${styles.bulkBtn} ${styles.bulkBtnWarning}`}
                onClick={() => {
                  setMutError("");
                  setModal({ mode: "bulk-reset" });
                }}
                disabled={mutating}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                  <line x1="12" y1="15" x2="12" y2="17" />
                </svg>
                Đặt lại mật khẩu
              </button>
              <button
                className={styles.bulkClear}
                onClick={() => setSelected(new Set())}
              >
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Table */}
          {tkLoading ? (
            <TableSkeleton cols={6} rows={8} />
          ) : (
            <>
              {!tkList.length ? (
                <EmptyState message="Không tìm thấy tài khoản nào." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className={styles.checkCell}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            aria-label="Chọn tất cả"
                          />
                        </th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Đăng nhập cuối</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tkList.map((tk) => (
                        <tr
                          key={tk.mataikhoan}
                          className={
                            selected.has(tk.mataikhoan)
                              ? styles.rowSelected
                              : ""
                          }
                        >
                          <td className={styles.checkCell}>
                            {tk.vaitro !== VaiTro.Admin && (
                              <input
                                type="checkbox"
                                checked={selected.has(tk.mataikhoan)}
                                onChange={() => toggleOne(tk.mataikhoan)}
                                aria-label={`Chọn ${tk.email}`}
                              />
                            )}
                          </td>
                          <td>
                            <div className={styles.emailCell}>
                              <span className={styles.emailText}>
                                {tk.email}
                              </span>
                              <code className={styles.idCode}>
                                {tk.mataikhoan}
                              </code>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${ROLE_BADGE[tk.vaitro] ?? "badge-peach"}`}
                            >
                              {ROLE_LABEL[tk.vaitro] ?? tk.vaitro}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${STATUS_BADGE[tk.trangthai] ?? "badge-peach"}`}
                            >
                              {STATUS_LABEL[tk.trangthai] ?? tk.trangthai}
                            </span>
                          </td>
                          <td className={styles.dateCell}>
                            {tk.dangnhaplancuoi ? (
                              new Date(tk.dangnhaplancuoi).toLocaleString(
                                "vi-VN",
                                { dateStyle: "short", timeStyle: "short" },
                              )
                            ) : (
                              <span
                                style={{
                                  color: "#BBA89A",
                                  fontStyle: "italic",
                                }}
                              >
                                Chưa đăng nhập
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: tk });
                                }}
                                title="Chỉnh sửa trạng thái"
                              >
                                Sửa
                              </button>
                              {tk.vaitro !== VaiTro.Admin && (
                                <>
                                  <button
                                    className={styles.resetBtn}
                                    onClick={() => {
                                      setMutError("");
                                      setModal({
                                        mode: "quick-reset",
                                        item: tk,
                                      });
                                    }}
                                    title="Đặt lại mật khẩu nhanh"
                                  >
                                    <svg
                                      width="13"
                                      height="13"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    >
                                      <rect
                                        x="3"
                                        y="11"
                                        width="18"
                                        height="11"
                                        rx="2"
                                        ry="2"
                                      />
                                      <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                    Mật khẩu
                                  </button>
                                  <button
                                    className="btn-danger"
                                    style={{
                                      fontSize: 12,
                                      padding: "4px 10px",
                                    }}
                                    onClick={() => {
                                      setMutError("");
                                      setModal({ mode: "delete", item: tk });
                                    }}
                                  >
                                    Xoá
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                page={page}
                totalPages={pages}
                total={total}
                limit={15}
                onPage={setPage}
              />
            </>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
      {modal?.mode === "edit" && modal.item && (
        <AdminModal title="Chỉnh sửa tài khoản" onClose={() => setModal(null)}>
          <EditAccountForm
            item={modal.item}
            onSubmit={handleEdit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "quick-reset" && modal.item && (
        <AdminModal
          title="Đặt lại mật khẩu"
          onClose={() => setModal(null)}
          size="sm"
        >
          <QuickResetForm
            item={modal.item}
            onSubmit={handleQuickReset}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "bulk-reset" && (
        <AdminModal
          title={`Đặt lại mật khẩu (${selected.size} tài khoản)`}
          onClose={() => setModal(null)}
          size="sm"
        >
          <BulkResetForm
            count={selected.size}
            onSubmit={handleBulkReset}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá tài khoản"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={modal.item.email}
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

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </DashboardShell>
  );
}
