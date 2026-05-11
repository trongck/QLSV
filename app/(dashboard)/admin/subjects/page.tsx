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
import { useMonhoc, type MonhocRow } from "@/hooks/admin/useMonhoc";
import { useKhoa, type KhoaRow } from "@/hooks/admin/useKhoa";
import { VaiTro } from "@/types";
import styles from "./subject.module.css";

// ─── Form Component ───────────────────────────────────────────────────────────

function SubjectForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: Partial<MonhocRow>;
  khoas: KhoaRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    mamon: initial?.mamon ?? "",
    tenmon: initial?.tenmon ?? "",
    sotinchi: initial?.sotinchi ?? 3,
    sotietlythuyet: initial?.sotietlythuyet ?? 0,
    sotietthuchanh: initial?.sotietthuchanh ?? 0,
    mota: initial?.mota ?? "",
    batbuoc: initial?.batbuoc ?? true,
    makhoa: initial?.makhoa ?? "",
  });

  const [validation, setValidation] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.mamon.trim()) errs.mamon = "Mã môn không được trống.";
    if (!form.tenmon.trim()) errs.tenmon = "Tên môn không được trống.";
    if (form.sotinchi < 1) errs.sotinchi = "Tín chỉ tối thiểu là 1.";
    setValidation(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSumbitClick = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã môn học *</label>
          <input
            value={form.mamon}
            onChange={(e) =>
              setForm({ ...form, mamon: e.target.value.toUpperCase() })
            }
            disabled={!!initial?.mamon}
            placeholder="VD: INT1234"
          />
          {validation.mamon && (
            <span className="error-text">{validation.mamon}</span>
          )}
        </div>
        <div className="field">
          <label>Tên môn học *</label>
          <input
            value={form.tenmon}
            onChange={(e) => setForm({ ...form, tenmon: e.target.value })}
            placeholder="VD: Cấu trúc dữ liệu"
          />
          {validation.tenmon && (
            <span className="error-text">{validation.tenmon}</span>
          )}
        </div>
        <div className="field">
          <label>Số tín chỉ *</label>
          <input
            type="number"
            value={form.sotinchi}
            onChange={(e) =>
              setForm({ ...form, sotinchi: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label>Khoa quản lý</label>
          <select
            value={form.makhoa ?? ""}
            onChange={(e) => setForm({ ...form, makhoa: e.target.value })}
          >
            <option value="">-- Chọn khoa --</option>
            {khoas.map((k) => (
              <option key={k.makhoa} value={k.makhoa}>
                {k.tenkhoa}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Số tiết lý thuyết</label>
          <input
            type="number"
            value={form.sotietlythuyet}
            onChange={(e) =>
              setForm({ ...form, sotietlythuyet: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label>Số tiết thực hành</label>
          <input
            type="number"
            value={form.sotietthuchanh}
            onChange={(e) =>
              setForm({ ...form, sotietthuchanh: Number(e.target.value) })
            }
          />
        </div>
        <div className="field full">
          <label>Loại môn học</label>
          <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={form.batbuoc}
                onChange={() => setForm({ ...form, batbuoc: true })}
              />
              Bắt buộc
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={!form.batbuoc}
                onChange={() => setForm({ ...form, batbuoc: false })}
              />
              Tự chọn
            </label>
          </div>
        </div>
        <div className="field full">
          <label>Mô tả môn học</label>
          <textarea
            rows={3}
            value={form.mota ?? ""}
            onChange={(e) => setForm({ ...form, mota: e.target.value })}
            placeholder="Thông tin tóm tắt về môn học..."
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={handleSumbitClick}
          disabled={loading}
        >
          {loading
            ? "Đang lưu..."
            : initial?.mamon
              ? "Cập nhật"
              : "Thêm môn học"}
        </button>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getKhoa } = useKhoa();
  const { getMonhoc, createMonhoc, updateMonhoc, deleteMonhoc } = useMonhoc();
  const router = useRouter();

  const [list, setList] = useState<MonhocRow[]>([]);
  const [khoas, setKhoas] = useState<KhoaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [cReq, setCReq] = useState(0);
  const [cOpt, setCOpt] = useState(0);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete";
    item?: MonhocRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMonhoc({
        search,
        makhoa: filterKhoa,
        batbuoc:
          filterType === "true"
            ? true
            : filterType === "false"
              ? false
              : undefined,
        page,
        limit: 10,
      });
      setList(res.data);
      setTotal(res.pagination.total);
      setCReq(res.pagination.countRequired);
      setCOpt(res.pagination.countOptional);
      setTotalAll(res.pagination.totalAll);
    } catch {
      /* error handling */
    } finally {
      setIsLoading(false);
    }
  }, [search, filterKhoa, filterType, page]);

  useEffect(() => {
    if (!authLoading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
    if (user) {
      loadData();
      getKhoa()
        .then(setKhoas)
        .catch(() => {});
    }
  }, [user, authLoading, router, loadData]);

  if (authLoading || !user) return null;

  const handleSubmit = async (form: any) => {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updateMonhoc(modal.item.mamon, form);
      } else {
        await createMonhoc(form);
      }
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Lỗi lưu dữ liệu.");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteMonhoc(modal.item.mamon);
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Không thể xoá môn học.");
    } finally {
      setMutating(false);
    }
  };

  return (
    <DashboardShell pageTitle="Quản lý Môn học">
      <div className={`animate-fadeInUp ${styles.page}`}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý Môn học</h1>
            <p className={styles.subtitle}>
              Quản lý danh mục học phần, tín chỉ và khoa phụ trách
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm môn học
          </button>
        </div>

        {/* Thống kê nhanh */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Tổng số môn</span>
            <span className={styles.statValue}>{totalAll}</span>
          </div>
          <div
            className={styles.statCard}
            style={{ background: "#FBD9D9", borderColor: "#FFB6B6" }}
          >
            <span className={styles.statLabel}>Môn bắt buộc</span>
            <span className={styles.statValue}>{cReq}</span>
          </div>
          <div
            className={styles.statCard}
            style={{ background: "#FEFAE3", borderColor: "#EAD9CB" }}
          >
            <span className={styles.statLabel}>Môn tự chọn</span>
            <span className={styles.statValue}>{cOpt}</span>
          </div>
        </div>

        <section className="card" style={{ padding: 0 }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Mã hoặc tên môn..."
            />
            <select
              className={styles.filterSelect}
              value={filterKhoa}
              onChange={(e) => {
                setFilterKhoa(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả khoa --</option>
              {khoas.map((k) => (
                <option key={k.makhoa} value={k.makhoa}>
                  {k.tenkhoa}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả loại --</option>
              <option value="true">Bắt buộc</option>
              <option value="false">Tự chọn</option>
            </select>
            {(search || filterKhoa || filterType) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterKhoa("");
                  setFilterType("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {isLoading ? (
            <TableSkeleton cols={5} rows={5} />
          ) : (
            <div className={styles.tableContainer}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã môn</th>
                    <th>Tên môn học</th>
                    <th>Tín chỉ</th>
                    <th>Khoa</th>
                    <th>Loại</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((m) => (
                    <tr key={m.mamon}>
                      <td>
                        <span className={styles.subjectCode}>{m.mamon}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.tenmon}</td>
                      <td>{m.sotinchi}</td>
                      <td>{m.khoa?.tenkhoa || "—"}</td>
                      <td>
                        {m.batbuoc ? (
                          <span className={styles.badgeRequired}>Bắt buộc</span>
                        ) : (
                          <span className={styles.badgeOptional}>Tự chọn</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            onClick={() => {
                              setMutError("");
                              setModal({ mode: "edit", item: m });
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 11, padding: "4px 8px" }}
                            onClick={() => {
                              setMutError("");
                              setModal({ mode: "delete", item: m });
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
              {!list.length && <EmptyState />}
            </div>
          )}

          {total > 0 && (
            <div style={{ padding: "20px" }}>
              <Pagination
                page={page}
                total={total}
                limit={10}
                totalPages={Math.ceil(total / 10)}
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
            modal.mode === "create" ? "Thêm môn học mới" : "Chỉnh sửa môn học"
          }
          onClose={() => setModal(null)}
        >
          <SubjectForm
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
          title="Xoá môn học"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={modal.item.tenmon}
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
