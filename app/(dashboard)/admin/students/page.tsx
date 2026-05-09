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
  getSinhVien,
  createSinhVien,
  updateSinhVien,
  deleteSinhVien,
  type SinhVienRow,
} from "@/services/admin/sinhvien.services/sinhvien.service";
import { getKhoa, type KhoaRow } from "@/services/admin/khoa.service";
import { getLop, type LopRow } from "@/services/admin/lop.service";
import { VaiTro, TrangThaiSinhVien } from "@/types";
import styles from "./students.module.css";
import {
  validateSinhVienCreate,
  validateSinhVienUpdate,
  firstError,
} from "@/lib/validation/admin.validation";
import ImportModal from "@/components/admin/ImportModal";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  Danghoc: "Đang học",
  Baoluu: "Bảo lưu",
  Thoi: "Thôi học",
  Totnghiep: "Tốt nghiệp",
};
const STATUS_BADGE: Record<string, string> = {
  Danghoc: "badge-green",
  Baoluu: "badge-yellow",
  Thoi: "badge-red",
  Totnghiep: "badge-blue",
};

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateForm({
  lops,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  lops: LopRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    masv: "",
    malop: "",
    hoten: "",
    ngaysinh: "",
    gioitinh: "",
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
          <label>MSSV *</label>
          <input
            value={form.masv}
            onChange={set("masv")}
            placeholder="VD: SV001"
          />
        </div>
        <div className="field">
          <label>Lớp *</label>
          <select value={form.malop} onChange={set("malop")}>
            <option value="">-- Chọn lớp --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Họ và tên *</label>
          <input
            value={form.hoten}
            onChange={set("hoten")}
            placeholder="Nguyễn Văn A"
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
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
            placeholder="sv@truong.edu.vn"
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
          {loading ? "Đang lưu…" : "Tạo sinh viên"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  initial,
  lops,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: SinhVienRow;
  lops: LopRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    hoten: initial.hoten,
    malop: initial.malop,
    ngaysinh: initial.ngaysinh?.slice(0, 10) ?? "",
    gioitinh: initial.gioitinh ?? "",
    emailtruong: initial.emailtruong ?? "",
    trangthai: initial.trangthai,
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
          <label>Lớp</label>
          <select value={form.malop} onChange={set("malop")}>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={form.trangthai} onChange={set("trangthai")}>
            {Object.values(TrangThaiSinhVien).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
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

export default function AdminStudentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showImport, setShowImport] = useState(false);
  const [svList, setSvList] = useState<SinhVienRow[]>([]);
  const [khoas, setKhoas] = useState<KhoaRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("");
  const [filterLop, setFilterLop] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [svLoading, setSvLoading] = useState(true);

  type ModalMode = "create" | "edit" | "delete";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: SinhVienRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  // Load filters once
  useEffect(() => {
    if (!user) return;
    getKhoa()
      .then(setKhoas)
      .catch(() => {});
    getLop({ limit: 100 })
      .then((r) => setLops(r.data))
      .catch(() => {});
  }, [user]);

  const loadSV = useCallback(async () => {
    setSvLoading(true);
    try {
      const res = await getSinhVien({
        search,
        makhoa: filterKhoa,
        malop: filterLop,
        trangthai: filterStatus,
        page,
        limit: 15,
      });
      setSvList(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.totalPages);
    } catch {
      /* ignore */
    } finally {
      setSvLoading(false);
    }
  }, [search, filterKhoa, filterLop, filterStatus, page]);

  useEffect(() => {
    if (user) loadSV();
  }, [user, loadSV]);

  if (loading || !user) return null;

  const filteredLops = filterKhoa
    ? lops.filter((l) => l.makhoa === filterKhoa)
    : lops;

  async function handleSubmit(form: Record<string, unknown>) {
    // ── Validate theo mode ──
    const isEdit = modal?.mode === "edit";
    const errors = isEdit
      ? validateSinhVienUpdate(form)
      : validateSinhVienCreate(form);
    if (errors.length) {
      setMutError(firstError(errors));
      return;
    }

    setMutating(true);
    setMutError("");
    try {
      if (isEdit && modal.item) {
        await updateSinhVien(modal.item.masv, form);
      } else {
        await createSinhVien(form);
      }
      setModal(null);
      await loadSV();
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
      await deleteSinhVien(modal.item.masv);
      setModal(null);
      await loadSV();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

  return (
    <DashboardShell pageTitle="Sinh viên">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Sinh viên</h1>
            <p className={styles.pageSub}>
              {total > 0
                ? `${total} sinh viên trong hệ thống`
                : "Quản lý toàn bộ sinh viên"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn-secondary"
              onClick={() => setShowImport(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Excel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setMutError("");
                setModal({ mode: "create" });
              }}
            >
              + Thêm sinh viên
            </button>
          </div>
        </div>

        {/* Filters */}
        <section className="card" style={{ padding: 0 }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm MSSV hoặc tên…"
            />
            <select
              className={styles.filter}
              value={filterKhoa}
              onChange={(e) => {
                setFilterKhoa(e.target.value);
                setFilterLop("");
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
            <select
              className={styles.filter}
              value={filterLop}
              onChange={(e) => {
                setFilterLop(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả lớp</option>
              {filteredLops.map((l) => (
                <option key={l.malop} value={l.malop}>
                  {l.tenlop}
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
              {Object.values(TrangThaiSinhVien).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>

            {(search || filterKhoa || filterLop || filterStatus) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterKhoa("");
                  setFilterLop("");
                  setFilterStatus("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {svLoading ? (
            <TableSkeleton cols={6} rows={8} />
          ) : (
            <>
              {!svList.length ? (
                <EmptyState message="Không tìm thấy sinh viên nào." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>MSSV</th>
                        <th>Họ tên</th>
                        <th>Lớp</th>
                        <th>Khoa</th>
                        <th>Email trường</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {svList.map((sv) => (
                        <tr key={sv.masv}>
                          <td>
                            <code style={{ fontSize: 12 }}>{sv.masv}</code>
                          </td>
                          <td>
                            <strong style={{ color: "#2D1B14" }}>
                              {sv.hoten}
                            </strong>
                          </td>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <td>{(sv as any).lop?.tenlop ?? sv.malop}</td>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <td style={{ fontSize: 12, color: "#6B4F3F" }}>
                            {(sv as any).lop?.khoa?.tenkhoa ?? "—"}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {sv.emailtruong ?? "—"}
                          </td>
                          <td>
                            <span
                              className={`badge ${STATUS_BADGE[sv.trangthai] ?? "badge-peach"}`}
                            >
                              {STATUS_LABEL[sv.trangthai] ?? sv.trangthai}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: sv });
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-danger"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: sv });
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
          title="Thêm sinh viên mới"
          onClose={() => setModal(null)}
          size="lg"
        >
          <CreateForm
            lops={lops}
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
            lops={lops}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}
      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá sinh viên"
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
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={(count) => {
            setShowImport(false);
            loadSV(); // reload danh sách
          }}
        />
      )}
    </DashboardShell>
  );
}
