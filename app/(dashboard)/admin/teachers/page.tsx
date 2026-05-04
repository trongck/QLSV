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
  getGiangVien,
  createGiangVien,
  updateGiangVien,
  deleteGiangVien,
  getKhoa,
  type GiangVienRow,
  type KhoaRow,
} from "@/services/admin.service";
import { VaiTro } from "@/types";
import styles from "./teachers.module.css";

const HOCVI_LIST = ["Cử nhân", "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"];

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateForm({
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    magv: "",
    makhoa: "",
    hoten: "",
    ngaysinh: "",
    gioitinh: "",
    hocvi: "",
    chuyennganh: "",
    emailtruong: "",
    email: "",
    matkhau: "",
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
          <label>Mã giảng viên *</label>
          <input
            value={form.magv}
            onChange={set("magv")}
            placeholder="VD: GV001"
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
        <div className="field full">
          <label>Họ và tên *</label>
          <input
            value={form.hoten}
            onChange={set("hoten")}
            placeholder="Nguyễn Văn B"
          />
        </div>
        <div className="field">
          <label>Ngày sinh</label>
          <input type="date" value={form.ngaysinh} onChange={set("ngaysinh")} />
        </div>
        <div className="field">
          <label>Giới tính</label>
          <select value={form.gioitinh} onChange={set("gioitinh")}>
            <option value="">-- Chọn --</option>
            <option value="Nam">Nam</option>
            <option value="Nu">Nữ</option>
            <option value="Khac">Khác</option>
          </select>
        </div>
        <div className="field">
          <label>Học vị</label>
          <select value={form.hocvi} onChange={set("hocvi")}>
            <option value="">-- Chọn --</option>
            {HOCVI_LIST.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Chuyên ngành</label>
          <input
            value={form.chuyennganh}
            onChange={set("chuyennganh")}
            placeholder="VD: Trí tuệ nhân tạo"
          />
        </div>
        <div className="field full">
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
            placeholder="gv@truong.edu.vn"
          />
        </div>
        <div className="field">
          <label>Email đăng nhập *</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="email@gmail.com"
          />
        </div>
        <div className="field">
          <label>Mật khẩu *</label>
          <input
            type="password"
            value={form.matkhau}
            onChange={set("matkhau")}
            placeholder="••••••••"
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
          {loading ? "Đang lưu…" : "Tạo giảng viên"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: GiangVienRow;
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    hoten: initial.hoten,
    makhoa: initial.makhoa ?? "",
    ngaysinh: initial.ngaysinh?.slice(0, 10) ?? "",
    gioitinh: initial.gioitinh ?? "",
    hocvi: initial.hocvi ?? "",
    chuyennganh: initial.chuyennganh ?? "",
    emailtruong: initial.emailtruong ?? "",
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Họ và tên *</label>
          <input value={form.hoten} onChange={set("hoten")} />
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
          <label>Học vị</label>
          <select value={form.hocvi} onChange={set("hocvi")}>
            <option value="">-- Chọn --</option>
            {HOCVI_LIST.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ngày sinh</label>
          <input type="date" value={form.ngaysinh} onChange={set("ngaysinh")} />
        </div>
        <div className="field">
          <label>Giới tính</label>
          <select value={form.gioitinh} onChange={set("gioitinh")}>
            <option value="">-- Chọn --</option>
            <option value="Nam">Nam</option>
            <option value="Nu">Nữ</option>
            <option value="Khac">Khác</option>
          </select>
        </div>
        <div className="field full">
          <label>Chuyên ngành</label>
          <input value={form.chuyennganh} onChange={set("chuyennganh")} />
        </div>
        <div className="field full">
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
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
          {loading ? "Đang lưu…" : "Cập nhật"}
        </button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTeachersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [gvList, setGvList] = useState<GiangVienRow[]>([]);
  const [khoas, setKhoas] = useState<KhoaRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [gvLoading, setGvLoading] = useState(true);

  type ModalMode = "create" | "edit" | "delete";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: GiangVienRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user)
      getKhoa()
        .then(setKhoas)
        .catch(() => {});
  }, [user]);

  const loadGV = useCallback(async () => {
    setGvLoading(true);
    try {
      const res = await getGiangVien({
        search,
        makhoa: filterKhoa,
        page,
        limit: 15,
      });
      setGvList(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.totalPages);
    } catch {
      /* ignore */
    } finally {
      setGvLoading(false);
    }
  }, [search, filterKhoa, page]);

  useEffect(() => {
    if (user) loadGV();
  }, [user, loadGV]);

  if (loading || !user) return null;

  async function handleSubmit(form: Record<string, unknown>) {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updateGiangVien(modal.item.magv, form);
      } else {
        await createGiangVien(form);
      }
      setModal(null);
      await loadGV();
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
      await deleteGiangVien(modal.item.magv);
      setModal(null);
      await loadGV();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

  return (
    <DashboardShell pageTitle="Giảng viên">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Giảng viên</h1>
            <p className={styles.pageSub}>
              {total > 0
                ? `${total} giảng viên trong hệ thống`
                : "Quản lý đội ngũ giảng viên"}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm giảng viên
          </button>
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
              placeholder="Tìm mã GV hoặc tên…"
            />
            <select
              className={styles.filter}
              value={filterKhoa}
              onChange={(e) => {
                setFilterKhoa(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả khoa</option>
              {khoas.map((k) => (
                <option key={k.makhoa} value={k.makhoa}>
                  {k.tenkhoa}
                </option>
              ))}
            </select>
            {(search || filterKhoa) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterKhoa("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {gvLoading ? (
            <TableSkeleton cols={6} rows={8} />
          ) : (
            <>
              {!gvList.length ? (
                <EmptyState message="Không tìm thấy giảng viên nào." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã GV</th>
                        <th>Họ tên</th>
                        <th>Khoa</th>
                        <th>Học vị</th>
                        <th>Chuyên ngành</th>
                        <th>Email trường</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gvList.map((gv) => (
                        <tr key={gv.magv}>
                          <td>
                            <code style={{ fontSize: 12 }}>{gv.magv}</code>
                          </td>
                          <td>
                            <strong style={{ color: "#2D1B14" }}>
                              {gv.hoten}
                            </strong>
                          </td>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <td style={{ fontSize: 12, color: "#6B4F3F" }}>
                            {(gv as any).khoa?.tenkhoa ?? "—"}
                          </td>
                          <td>
                            {gv.hocvi ? (
                              <span className="badge badge-blue">
                                {gv.hocvi}
                              </span>
                            ) : (
                              <span style={{ color: "#BBA89A" }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {gv.chuyennganh ?? "—"}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {gv.emailtruong ?? "—"}
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: gv });
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-danger"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: gv });
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
      {modal?.mode === "create" && (
        <AdminModal
          title="Thêm giảng viên mới"
          onClose={() => setModal(null)}
          size="lg"
        >
          <CreateForm
            khoas={khoas}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}
      {modal?.mode === "edit" && modal.item && (
        <AdminModal
          title={`Chỉnh sửa: ${modal.item.hoten}`}
          onClose={() => setModal(null)}
          size="lg"
        >
          <EditForm
            initial={modal.item}
            khoas={khoas}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}
      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá giảng viên"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={modal.item.hoten}
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
