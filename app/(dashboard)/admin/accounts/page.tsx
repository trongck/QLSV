"use client";

import { useEffect, useState, useCallback } from "react";
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
  type TaiKhoanRow,
} from "@/services/admin.service";
import { VaiTro } from "@/types";
import styles from "./accounts.module.css";
import { validateTaiKhoanUpdate, firstError } from "@/lib/validation/admin.validation";
// ─── Config ───────────────────────────────────────────────────────────────────

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

// ─── Edit Modal: toggle status or reset password ──────────────────────────────

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
          {/* Dummy hidden input to "catch" browser autofill */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminAccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tkList, setTkList] = useState<TaiKhoanRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [tkLoading, setTkLoading] = useState(true);

  type ModalMode = "edit" | "delete";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item: TaiKhoanRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

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
    } catch {
      /* ignore */
    } finally {
      setTkLoading(false);
    }
  }, [search, filterRole, filterStatus, page]);

  useEffect(() => {
    if (user) loadTK();
  }, [user, loadTK]);

  if (loading || !user) return null;

  async function handleEdit(form: { trangthai?: string; matkhau?: string }) {
  const errors = validateTaiKhoanUpdate(form);
  if (errors.length) { setMutError(firstError(errors)); return; }

  setMutating(true); setMutError("");
  try {
    await updateTaiKhoan(modal!.item.mataikhoan, form);
    setModal(null);
    await loadTK();
  } catch (e) {
    setMutError(e instanceof Error ? e.message : "Lỗi không xác định.");
  } finally { setMutating(false); }
}

  async function handleDelete() {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteTaiKhoan(modal.item.mataikhoan);
      setModal(null);
      await loadTK();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

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

          {/* Summary chips */}
          <div className={styles.summaryChips}>
            <div className={styles.chip} style={{ background: "#FEE2E2" }}>
              <span className="badge badge-red">Admin</span>
            </div>
            <div className={styles.chip} style={{ background: "#DBEAFE" }}>
              <span className="badge badge-blue">Giảng viên</span>
            </div>
            <div className={styles.chip} style={{ background: "#D1FAE5" }}>
              <span className="badge badge-green">Sinh viên</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <section className="card" style={{ padding: 0 }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm email…"
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

          {tkLoading ? (
            <TableSkeleton cols={5} rows={8} />
          ) : (
            <>
              {!tkList.length ? (
                <EmptyState message="Không tìm thấy tài khoản nào." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã tài khoản</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Lần đăng nhập cuối</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tkList.map((tk) => (
                        <tr key={tk.mataikhoan}>
                          <td>
                            <code style={{ fontSize: 12 }}>
                              {tk.mataikhoan}
                            </code>
                          </td>
                          <td style={{ fontWeight: 500, color: "#2D1B14" }}>
                            {tk.email}
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
                          <td style={{ fontSize: 12, color: "#8B6F5F" }}>
                            {tk.dangnhaplancuoi
                              ? new Date(tk.dangnhaplancuoi).toLocaleString(
                                  "vi-VN",
                                  { dateStyle: "short", timeStyle: "short" },
                                )
                              : "Chưa đăng nhập"}
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
                              >
                                Sửa
                              </button>
                              {tk.vaitro !== VaiTro.Admin && (
                                <button
                                  className="btn-danger"
                                  style={{ fontSize: 12, padding: "4px 10px" }}
                                  onClick={() => {
                                    setMutError("");
                                    setModal({ mode: "delete", item: tk });
                                  }}
                                >
                                  Xoá
                                </button>
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
      {modal?.mode === "edit" && (
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
      {modal?.mode === "delete" && (
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
    </DashboardShell>
  );
}
