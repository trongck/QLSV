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
  getKhoa,
  createKhoa,
  updateKhoa,
  deleteKhoa,
  getLop,
  createLop,
  updateLop,
  deleteLop,
  type KhoaRow,
  type LopRow,
} from "@/services/admin.service";
import { VaiTro } from "@/types";
import styles from "./classes.module.css";
import {
  validateKhoa,
  validateLop,
  firstError,
  LopPayload,
  KhoaPayload,
} from "@/lib/validation/admin.validation";
// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "khoa" | "lop";
type ModalMode = "create" | "edit" | "delete";

interface KhoaModalState {
  mode: ModalMode;
  item?: KhoaRow;
}
interface LopModalState {
  mode: ModalMode;
  item?: LopRow;
}

// ─── Khoa Form ────────────────────────────────────────────────────────────────

function KhoaForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: KhoaRow;
  onSubmit: (d: Omit<KhoaRow, "ngaytao">) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    makhoa: initial?.makhoa ?? "",
    tenkhoa: initial?.tenkhoa ?? "",
    dienthoai: initial?.dienthoai ?? "",
    email: initial?.email ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã khoa *</label>
          <input
            value={form.makhoa}
            onChange={set("makhoa")}
            placeholder="VD: CNTT"
            disabled={!!initial}
          />
        </div>
        <div className="field full">
          <label>Tên khoa *</label>
          <input
            value={form.tenkhoa}
            onChange={set("tenkhoa")}
            placeholder="VD: Công nghệ thông tin"
          />
        </div>
        <div className="field">
          <label>Điện thoại</label>
          <input
            value={form.dienthoai}
            onChange={set("dienthoai")}
            placeholder="028 xxxx xxxx"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="khoa@truong.edu.vn"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(form)}
          disabled={loading}
        >
          {loading ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo khoa"}
        </button>
      </div>
    </>
  );
}

// ─── Lop Form ─────────────────────────────────────────────────────────────────

function LopForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: LopRow;
  khoas: KhoaRow[];
  onSubmit: (d: Omit<LopRow, "siso">) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    malop: initial?.malop ?? "",
    tenlop: initial?.tenlop ?? "",
    makhoa: initial?.makhoa ?? "",
    nganh: initial?.nganh ?? "",
    khoahoc: initial?.khoahoc ?? "",
    magv: initial?.magv ?? "",
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã lớp *</label>
          <input
            value={form.malop}
            onChange={set("malop")}
            placeholder="VD: CNTT01"
            disabled={!!initial}
          />
        </div>
        <div className="field full">
          <label>Tên lớp *</label>
          <input
            value={form.tenlop}
            onChange={set("tenlop")}
            placeholder="VD: Lớp Công nghệ thông tin 01"
          />
        </div>
        <div className="field">
          <label>Khoa</label>
          <select value={form.makhoa} onChange={set("makhoa")}>
            <option value="">-- Chọn khoa --</option>
            {khoas.map((k) => (
              <option key={k.makhoa} value={k.makhoa}>
                {k.tenkhoa}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ngành học</label>
          <input
            value={form.nganh}
            onChange={set("nganh")}
            placeholder="VD: Kỹ thuật phần mềm"
          />
        </div>
        <div className="field">
          <label>Khoá học</label>
          <input
            value={form.khoahoc}
            onChange={set("khoahoc")}
            placeholder="VD: 2022-2026"
          />
        </div>
        <div className="field">
          <label>Mã GVCN</label>
          <input
            value={form.magv}
            onChange={set("magv")}
            placeholder="VD: GV001"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(form)}
          disabled={loading}
        >
          {loading ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo lớp"}
        </button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminClassesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("khoa");

  // Khoa state
  const [khoas, setKhoas] = useState<KhoaRow[]>([]);
  const [khoaSearch, setKhoaSearch] = useState("");
  const [khoaLoading, setKhoaLoading] = useState(true);
  const [khoaModal, setKhoaModal] = useState<KhoaModalState | null>(null);
  const [khoaMutating, setKhoaMutating] = useState(false);
  const [khoaError, setKhoaError] = useState("");

  // Lop state
  const [lops, setLops] = useState<LopRow[]>([]);
  const [lopSearch, setLopSearch] = useState("");
  const [lopKhoa, setLopKhoa] = useState("");
  const [lopPage, setLopPage] = useState(1);
  const [lopTotal, setLopTotal] = useState(0);
  const [lopPages, setLopPages] = useState(1);
  const [lopLoading, setLopLoading] = useState(true);
  const [lopModal, setLopModal] = useState<LopModalState | null>(null);
  const [lopMutating, setLopMutating] = useState(false);
  const [lopError, setLopError] = useState("");

  // Auth guard
  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  // Load khoa
  const loadKhoa = useCallback(async () => {
    setKhoaLoading(true);
    try {
      setKhoas(await getKhoa(khoaSearch));
    } catch {
      /* ignore */
    } finally {
      setKhoaLoading(false);
    }
  }, [khoaSearch]);

  useEffect(() => {
    if (user) loadKhoa();
  }, [user, loadKhoa]);

  // Load lop
  const loadLop = useCallback(async () => {
    setLopLoading(true);
    try {
      const res = await getLop({
        search: lopSearch,
        makhoa: lopKhoa,
        page: lopPage,
        limit: 15,
      });
      setLops(res.data);
      setLopTotal(res.pagination.total);
      setLopPages(res.pagination.totalPages);
    } catch {
      /* ignore */
    } finally {
      setLopLoading(false);
    }
  }, [lopSearch, lopKhoa, lopPage]);

  useEffect(() => {
    if (user) loadLop();
  }, [user, loadLop]);

  if (loading || !user) return null;

  // ── Khoa handlers ────────────────────────────────────────────────────────────

  async function handleKhoaSubmit(form: Omit<KhoaRow, "ngaytao">) {
    // ── Validate trước khi gọi API ──
    const errors = validateKhoa(form as KhoaPayload, khoaModal?.mode === "create");
    if (errors.length) {
      setKhoaError(firstError(errors));
      return;
    }

    setKhoaMutating(true);
    setKhoaError("");
    try {
      if (khoaModal?.mode === "edit" && khoaModal.item) {
        await updateKhoa(khoaModal.item.makhoa, form);
      } else {
        await createKhoa(form);
      }
      setKhoaModal(null);
      await loadKhoa();
    } catch (e) {
      setKhoaError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setKhoaMutating(false);
    }
  }

  async function handleKhoaDelete() {
    if (!khoaModal?.item) return;
    setKhoaMutating(true);
    setKhoaError("");
    try {
      await deleteKhoa(khoaModal.item.makhoa);
      setKhoaModal(null);
      await loadKhoa();
    } catch (e) {
      setKhoaError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setKhoaMutating(false);
    }
  }

  // ── Lop handlers ─────────────────────────────────────────────────────────────

  async function handleLopSubmit(form: Omit<LopRow, "siso">) {
    const errors = validateLop(form as LopPayload, lopModal?.mode === "create");
    if (errors.length) {
      setLopError(firstError(errors));
      return;
    }

    setLopMutating(true);
    setLopError("");
    try {
      if (lopModal?.mode === "edit" && lopModal.item) {
        await updateLop(lopModal.item.malop, form);
      } else {
        await createLop(form);
      }
      setLopModal(null);
      await loadLop();
    } catch (e) {
      setLopError(e instanceof Error ? e.message : "Lỗi không xác định.");
    } finally {
      setLopMutating(false);
    }
  }

  async function handleLopDelete() {
    if (!lopModal?.item) return;
    setLopMutating(true);
    setLopError("");
    try {
      await deleteLop(lopModal.item.malop);
      setLopModal(null);
      await loadLop();
    } catch (e) {
      setLopError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setLopMutating(false);
    }
  }

  return (
    <DashboardShell pageTitle="Lớp - Khoa">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Lớp &amp; Khoa</h1>
            <p className={styles.pageSub}>Tổ chức cơ cấu đào tạo của trường</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar} role="tablist">
          {(["khoa", "lop"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "khoa" ? "Khoa" : "Lớp học"}
            </button>
          ))}
        </div>

        {/* ── KHOA TAB ── */}
        {tab === "khoa" && (
          <section className="card" style={{ padding: 0 }}>
            <div className={styles.tableToolbar}>
              <SearchBar
                value={khoaSearch}
                onChange={setKhoaSearch}
                placeholder="Tìm tên khoa…"
              />
              <button
                className="btn-primary"
                onClick={() => {
                  setKhoaError("");
                  setKhoaModal({ mode: "create" });
                }}
              >
                + Thêm khoa
              </button>
            </div>

            {khoaLoading ? (
              <TableSkeleton cols={4} rows={5} />
            ) : (
              <>
                {!khoas.length ? (
                  <EmptyState message="Chưa có khoa nào." />
                ) : (
                  <div className={styles.tableWrap}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã khoa</th>
                          <th>Tên khoa</th>
                          <th>Điện thoại</th>
                          <th>Email</th>
                          <th>Ngày tạo</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {khoas.map((k) => (
                          <tr key={k.makhoa}>
                            <td>
                              <code style={{ fontSize: 12 }}>{k.makhoa}</code>
                            </td>
                            <td>
                              <strong style={{ color: "#2D1B14" }}>
                                {k.tenkhoa}
                              </strong>
                            </td>
                            <td>{k.dienthoai ?? "—"}</td>
                            <td>{k.email ?? "—"}</td>
                            <td style={{ fontSize: 12, color: "#8B6F5F" }}>
                              {new Date(k.ngaytao).toLocaleDateString("vi-VN")}
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className="btn-secondary"
                                  style={{ fontSize: 12, padding: "4px 10px" }}
                                  onClick={() => {
                                    setKhoaError("");
                                    setKhoaModal({ mode: "edit", item: k });
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ fontSize: 12, padding: "4px 10px" }}
                                  onClick={() => {
                                    setKhoaError("");
                                    setKhoaModal({ mode: "delete", item: k });
                                  }}
                                >
                                  Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── LOP TAB ── */}
        {tab === "lop" && (
          <section className="card" style={{ padding: 0 }}>
            <div className={styles.tableToolbar}>
              <SearchBar
                value={lopSearch}
                onChange={(v) => {
                  setLopSearch(v);
                  setLopPage(1);
                }}
                placeholder="Tìm tên lớp…"
              />
              <select
                className={styles.filterSelect}
                value={lopKhoa}
                onChange={(e) => {
                  setLopKhoa(e.target.value);
                  setLopPage(1);
                }}
              >
                <option value="">Tất cả khoa</option>
                {khoas.map((k) => (
                  <option key={k.makhoa} value={k.makhoa}>
                    {k.tenkhoa}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={() => {
                  setLopError("");
                  setLopModal({ mode: "create" });
                }}
              >
                + Thêm lớp
              </button>
            </div>

            {lopLoading ? (
              <TableSkeleton cols={5} rows={6} />
            ) : (
              <>
                {!lops.length ? (
                  <EmptyState message="Chưa có lớp nào." />
                ) : (
                  <div className={styles.tableWrap}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Mã lớp</th>
                          <th>Tên lớp</th>
                          <th>Khoa</th>
                          <th>Ngành</th>
                          <th>Khoá học</th>
                          <th>Sĩ số</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lops.map((l) => (
                          <tr key={l.malop}>
                            <td>
                              <code style={{ fontSize: 12 }}>{l.malop}</code>
                            </td>
                            <td>
                              <strong style={{ color: "#2D1B14" }}>
                                {l.tenlop}
                              </strong>
                            </td>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <td>{(l as any).khoa?.tenkhoa ?? "—"}</td>
                            <td>{l.nganh ?? "—"}</td>
                            <td>{l.khoahoc ?? "—"}</td>
                            <td>
                              <span className="badge badge-blue">{l.siso}</span>
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button
                                  className="btn-secondary"
                                  style={{ fontSize: 12, padding: "4px 10px" }}
                                  onClick={() => {
                                    setLopError("");
                                    setLopModal({ mode: "edit", item: l });
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ fontSize: 12, padding: "4px 10px" }}
                                  onClick={() => {
                                    setLopError("");
                                    setLopModal({ mode: "delete", item: l });
                                  }}
                                >
                                  Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Pagination
                  page={lopPage}
                  totalPages={lopPages}
                  total={lopTotal}
                  limit={15}
                  onPage={setLopPage}
                />
              </>
            )}
          </section>
        )}
      </div>

      {/* ── Khoa Modals ── */}
      {khoaModal && khoaModal.mode !== "delete" && (
        <AdminModal
          title={khoaModal.mode === "edit" ? "Chỉnh sửa khoa" : "Thêm khoa mới"}
          onClose={() => setKhoaModal(null)}
        >
          <KhoaForm
            initial={khoaModal.item}
            onSubmit={handleKhoaSubmit}
            onCancel={() => setKhoaModal(null)}
            loading={khoaMutating}
            error={khoaError}
          />
        </AdminModal>
      )}
      {khoaModal?.mode === "delete" && khoaModal.item && (
        <AdminModal
          title="Xoá khoa"
          onClose={() => setKhoaModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={khoaModal.item.tenkhoa}
            onConfirm={handleKhoaDelete}
            onCancel={() => setKhoaModal(null)}
            loading={khoaMutating}
          />
          {khoaError && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              {khoaError}
            </p>
          )}
        </AdminModal>
      )}

      {/* ── Lop Modals ── */}
      {lopModal && lopModal.mode !== "delete" && (
        <AdminModal
          title={lopModal.mode === "edit" ? "Chỉnh sửa lớp" : "Thêm lớp mới"}
          onClose={() => setLopModal(null)}
          size="lg"
        >
          <LopForm
            initial={lopModal.item}
            khoas={khoas}
            onSubmit={handleLopSubmit}
            onCancel={() => setLopModal(null)}
            loading={lopMutating}
            error={lopError}
          />
        </AdminModal>
      )}
      {lopModal?.mode === "delete" && lopModal.item && (
        <AdminModal title="Xoá lớp" onClose={() => setLopModal(null)} size="sm">
          <ConfirmDelete
            label={lopModal.item.tenlop}
            onConfirm={handleLopDelete}
            onCancel={() => setLopModal(null)}
            loading={lopMutating}
          />
          {lopError && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              {lopError}
            </p>
          )}
        </AdminModal>
      )}
    </DashboardShell>
  );
}
