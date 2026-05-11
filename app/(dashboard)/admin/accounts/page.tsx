"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
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
  useTaiKhoan,
  type TaiKhoanRow,
  type AccountStats,
} from "@/hooks/admin/useTaikhoan";
import { VaiTro, TrangThaiTaiKhoan } from "@/types";
import {
  StatsStrip,
  QuickResetForm,
  EditAccountForm,
  BulkResetForm,
  Toast,
} from "@/components/admin/AccountForms";
import {
  validateTaiKhoanUpdate,
  firstError,
} from "@/lib/validation/admin.validation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<VaiTro, string> = {
  [VaiTro.Admin]: "Quản trị viên",
  [VaiTro.GiangVien]: "Giảng viên",
  [VaiTro.SinhVien]: "Sinh viên",
};
const ROLE_BADGE: Record<VaiTro, string> = {
  [VaiTro.Admin]: "badge-red",
  [VaiTro.GiangVien]: "badge-blue",
  [VaiTro.SinhVien]: "badge-green",
};
const STATUS_BADGE: Record<TrangThaiTaiKhoan, string> = {
  [TrangThaiTaiKhoan.HoatDong]: "badge-green",
  [TrangThaiTaiKhoan.Khoa]: "badge-red",
};
const STATUS_LABEL: Record<TrangThaiTaiKhoan, string> = {
  [TrangThaiTaiKhoan.HoatDong]: "Hoạt động",
  [TrangThaiTaiKhoan.Khoa]: "Khoá",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type ModalMode = "edit" | "delete" | "quick-reset" | "bulk-reset";

export default function AdminAccountsPage() {
  const { user, loading } = useAuth();
  const {
    getTaiKhoan,
    updateTaiKhoan,
    deleteTaiKhoan,
    getAccountStats,
    bulkAccountAction,
    exportAccountsCSV,
  } = useTaiKhoan();
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
          <div>
            <h1 className="text-[22px] font-bold text-[#2D1B14] m-0 mb-1">
              Quản lý Tài khoản
            </h1>
            <p className="text-[13px] text-[#8B6F5F] m-0">
              {total > 0
                ? `${total} tài khoản trong hệ thống`
                : "Kiểm soát truy cập toàn hệ thống"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-1.5 p-[8px_14px] rounded-xl bg-[#FEFAE3] border-[1.5px] border-[#FFDBB6] text-[#6B4F3F] text-[13px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#FFF0CD] hover:border-primary hover:text-primary hover:-translate-y-0.5"
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
          <div className="flex items-center gap-2.5 p-[14px_20px] border-b border-[#EAD9CB] flex-wrap bg-[#FEFAE3] rounded-[14px_14px_0_0] max-sm:flex-col max-sm:items-stretch max-sm:p-3">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm email hoặc mã tài khoản, MSSV…"
            />
            <select
              className="p-[9px_12px] border-[1.5px] border-[#EAD9CB] rounded-[10px] text-xs text-[#2D1B14] bg-white outline-none cursor-pointer min-w-[130px] transition-all duration-150 focus:border-primary max-sm:w-full"
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
              className="p-[9px_12px] border-[1.5px] border-[#EAD9CB] rounded-[10px] text-xs text-[#2D1B14] bg-white outline-none cursor-pointer min-w-[130px] transition-all duration-150 focus:border-primary max-sm:w-full"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(TrangThaiTaiKhoan).map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABEL[st]}
                </option>
              ))}
            </select>
            {(search || filterRole || filterStatus) && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-[10px] text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-primary hover:text-white"
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
            <div className="flex items-center gap-2.5 p-[10px_20px] bg-[#FFF0CD] border-b border-[#EAD9CB] text-[13px] text-[#5C3D1E] font-medium flex-wrap max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <span>
                Đã chọn{" "}
                <span className="font-bold text-primary">{selected.size}</span>{" "}
                tài khoản
              </span>
              <div className="flex-1 max-sm:hidden" />
              <button
                className="inline-flex items-center gap-1.5 p-[6px_12px] rounded-lg bg-white border-[1.5px] border-[#EAD9CB] text-[#5C3D1E] text-[12.5px] font-semibold cursor-pointer transition-all duration-150 hover:border-primary hover:text-primary hover:bg-[#FFFDF9]"
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
                className="inline-flex items-center gap-1.5 p-[6px_12px] rounded-lg bg-white border-[1.5px] border-[#FBD9D9] text-primary text-[12.5px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#FFF5F5] hover:border-primary hover:text-primary"
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
                className="inline-flex items-center gap-1.5 p-[6px_12px] rounded-lg bg-white border-[1.5px] border-[#FFDBB6] text-[#B45309] text-[12.5px] font-semibold cursor-pointer transition-all duration-150 hover:bg-[#FFFBEB] hover:border-[#B45309]"
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
                className="bg-transparent border-none text-[#8B6F5F] text-[12.5px] font-medium cursor-pointer p-[6px_10px] rounded-md transition-colors duration-150 hover:bg-[#2D1B14]/5 hover:text-[#2D1B14]"
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
                <div className="w-full overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-9 text-center p-[0_8px_!important]">
                          <input
                            type="checkbox"
                            className="w-4 h-4 cursor-pointer accent-[#C25450]"
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
                              ? "bg-[#FFFDF4_!important] transition-all duration-150 [&_td]:border-b-[1.5px_!important] [&_td]:border-b-[#FFDBB6_!important]"
                              : ""
                          }
                        >
                          <td className="w-9 text-center p-[0_8px_!important]">
                            {tk.vaitro !== VaiTro.Admin && (
                              <input
                                type="checkbox"
                                className="w-4 h-4 cursor-pointer accent-[#C25450]"
                                checked={selected.has(tk.mataikhoan)}
                                onChange={() => toggleOne(tk.mataikhoan)}
                                aria-label={`Chọn ${tk.email}`}
                              />
                            )}
                          </td>
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-[#2D1B14] text-[13.5px]">
                                {tk.email}
                              </span>
                              <code className="font-mono text-[11px] text-[#8B6F5F] bg-[#FEFAE3] p-[1px_5px] rounded border border-[#EAD9CB] self-start">
                                {tk.mataikhoan}
                              </code>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${ROLE_BADGE[tk.vaitro as VaiTro] ?? "badge-peach"}`}
                            >
                              {ROLE_LABEL[tk.vaitro as VaiTro] ?? tk.vaitro}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${STATUS_BADGE[tk.trangthai as TrangThaiTaiKhoan] ?? "badge-peach"}`}
                            >
                              {STATUS_LABEL[tk.trangthai as TrangThaiTaiKhoan] ?? tk.trangthai}
                            </span>
                          </td>
                          <td className="text-xs text-[#6B4F3F]">
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
                            <div className="flex gap-1.5 flex-wrap">
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
                                    className="inline-flex items-center gap-1 p-[4px_10px] text-xs rounded-md bg-[#FEFAE3] border-[1.5px] border-[#FFDBB6] text-[#6B4F3F] cursor-pointer font-medium transition-all duration-150 hover:bg-[#FFF0CD] hover:border-primary hover:text-primary"
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
