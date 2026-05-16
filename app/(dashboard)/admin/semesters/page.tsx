"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import {
  SearchBar,
  TableSkeleton,
  EmptyState,
  ConfirmDelete,
} from "@/components/admin/AdminTable";
import {
  getHocky,
  createHocky,
  updateHocky,
  deleteHocky,
  activateHocky,
  type HockyRow,
} from "@/services/service/admin.service";
import { VaiTro } from "@/types";
import styles from "./semester.module.css";

// ─── Form Component ───────────────────────────────────────────────────────────

function HockyForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: Partial<HockyRow>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    tenhocky: initial?.tenhocky ?? "",
    namhoc: initial?.namhoc ?? new Date().getFullYear(),
    ky: initial?.ky ?? 1,
    ngaybatdau: initial?.ngaybatdau ?? "",
    ngayketthuc: initial?.ngayketthuc ?? "",
    danghieuluc: initial?.danghieuluc ?? false,
  });

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Tên học kỳ *</label>
          <input
            value={form.tenhocky}
            onChange={(e) => setForm({ ...form, tenhocky: e.target.value })}
            placeholder="VD: Học kỳ 1 năm học 2023-2024"
          />
        </div>
        <div className="field">
          <label>Năm học (năm bắt đầu) *</label>
          <input
            type="number"
            value={form.namhoc}
            onChange={(e) => setForm({ ...form, namhoc: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Kỳ *</label>
          <select
            value={form.ky}
            onChange={(e) => setForm({ ...form, ky: Number(e.target.value) })}
          >
            <option value={1}>Học kỳ 1</option>
            <option value={2}>Học kỳ 2</option>
            <option value={3}>Học kỳ hè</option>
          </select>
        </div>
        <div className="field">
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={form.ngaybatdau}
            onChange={(e) => setForm({ ...form, ngaybatdau: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Ngày kết thúc</label>
          <input
            type="date"
            value={form.ngayketthuc}
            onChange={(e) => setForm({ ...form, ngayketthuc: e.target.value })}
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
          {loading ? "Đang lưu…" : initial?.mahocky ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSemestersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<HockyRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterNam, setFilterNam] = useState<number | undefined>();
  const [tkLoading, setTkLoading] = useState(true);

  type ModalMode = "create" | "edit" | "delete" | "activate";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: HockyRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    setTkLoading(true);
    try {
      const res = await getHocky({ search, namhoc: filterNam });
      setList(res.data);
    } catch {
      /* ignore */
    } finally {
      setTkLoading(false);
    }
  }, [search, filterNam]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (loading || !user) return null;

  async function handleSubmit(form: any) {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updateHocky(modal.item.mahocky, form);
      } else {
        await createHocky(form);
      }
      setModal(null);
      loadData();
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
      await deleteHocky(modal.item.mahocky);
      setModal(null);
      loadData();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

  async function handleActivate() {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await activateHocky(modal.item.mahocky);
      setModal(null);
      loadData();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể kích hoạt.");
    } finally {
      setMutating(false);
    }
  }

  return (
    <DashboardShell pageTitle="Quản lý Học kỳ">
      <div className={`animate-fadeInUp ${styles.page}`}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Học kỳ</h1>
            <p className={styles.pageSub}>Thiết lập thời gian và học kỳ hiện tại cho hệ thống</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm học kỳ
          </button>
        </div>

        <section className="card" style={{ padding: 0 }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm tên học kỳ..."
            />
            <input
              type="number"
              className={styles.filter}
              placeholder="Năm học..."
              value={filterNam ?? ""}
              onChange={(e) => setFilterNam(e.target.value ? Number(e.target.value) : undefined)}
            />

            {(search || filterNam) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterNam(undefined);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {tkLoading ? (
            <TableSkeleton cols={5} rows={5} />
          ) : (
            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên học kỳ</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((hk) => {
                    const activeHK = list.find(item => item.danghieuluc);
                    let isOld = false;
                    let isFuture = false;
                    const isCurrent = hk.danghieuluc;

                    if (activeHK) {
                      const currentVal = activeHK.namhoc * 10 + activeHK.ky;
                      const targetVal = hk.namhoc * 10 + hk.ky;
                      if (targetVal < currentVal) isOld = true;
                      else if (targetVal > currentVal) isFuture = true;
                    } else {
                      // Nếu chưa có kỳ nào kích hoạt, coi tất cả là có thể sửa/xóa/kích hoạt
                      isFuture = true;
                    }

                    return (
                      <tr key={hk.mahocky}>
                        <td style={{ fontWeight: 600 }}>{hk.tenhocky}</td>
                        <td>
                          {hk.ngaybatdau ? new Date(hk.ngaybatdau).toLocaleDateString("vi-VN") : "?"}{" "}
                          - {hk.ngayketthuc ? new Date(hk.ngayketthuc).toLocaleDateString("vi-VN") : "?"}
                        </td>
                        <td>
                          {isCurrent ? (
                            <span className={styles.activeBadge}>Đang hiệu lực</span>
                          ) : (
                            <span className={styles.inactiveBadge}>Không hiệu lực</span>
                          )}
                        </td>
                        <td>
                          <div className={styles.actions}>
                            {/* Học kỳ tương lai: Kích hoạt, Sửa, Xoá */}
                            {isFuture && (
                              <>
                                <button
                                  className="btn-primary"
                                  style={{ fontSize: 11, padding: "4px 8px" }}
                                  onClick={() => setModal({ mode: "activate", item: hk })}
                                >
                                  Kích hoạt
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ fontSize: 11, padding: "4px 8px" }}
                                  onClick={() => {
                                    setMutError("");
                                    setModal({ mode: "edit", item: hk });
                                  }}
                                >
                                  Sửa
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ fontSize: 11, padding: "4px 8px" }}
                                  onClick={() => {
                                    setMutError("");
                                    setModal({ mode: "delete", item: hk });
                                  }}
                                >
                                  Xoá
                                </button>
                              </>
                            )}

                            {/* Học kỳ hiện tại: Chỉ sửa */}
                            {isCurrent && (
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 11, padding: "4px 8px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: hk });
                                }}
                              >
                                Sửa
                              </button>
                            )}

                            {/* Học kỳ cũ: Chỉ xoá */}
                            {isOld && (
                              <button
                                className="btn-danger"
                                style={{ fontSize: 11, padding: "4px 8px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: hk });
                                }}
                              >
                                Xoá
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!list.length && <EmptyState />}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <AdminModal
          title={modal.mode === "create" ? "Thêm học kỳ mới" : "Chỉnh sửa học kỳ"}
          onClose={() => setModal(null)}
        >
          <HockyForm
            initial={modal.item}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal title="Xoá học kỳ" onClose={() => setModal(null)} size="sm">
          <ConfirmDelete
            label={modal.item.tenhocky}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={mutating}
          />
          {mutError && <p className="error-msg" style={{ marginTop: 10 }}>{mutError}</p>}
        </AdminModal>
      )}

      {modal?.mode === "activate" && modal.item && (
        <AdminModal title="Kích hoạt học kỳ" onClose={() => setModal(null)} size="sm">
          <div style={{ padding: "10px 0" }}>
            <p>Bạn có chắc muốn kích hoạt <strong>{modal.item.tenhocky}</strong>?</p>
            <p style={{ fontSize: 13, color: "#8B6F5F", marginTop: 8 }}>
              Các học kỳ khác sẽ tự động bị huỷ kích hoạt.
            </p>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setModal(null)} disabled={mutating}>Huỷ</button>
            <button className="btn-primary" onClick={handleActivate} disabled={mutating}>
              {mutating ? "Đang xử lý..." : "Xác nhận kích hoạt"}
            </button>
          </div>
          {mutError && <p className="error-msg" style={{ marginTop: 10 }}>{mutError}</p>}
        </AdminModal>
      )}
    </DashboardShell>
  );
}
