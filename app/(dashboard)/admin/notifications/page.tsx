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
  Pagination,
} from "@/components/admin/AdminTable";
import {
  getThongbao,
  createThongbao,
  updateThongbao,
  deleteThongbao,
  getLop,
  getPhanCong,
  type ThongbaoRow,
  type LopRow,
  type PhanCongRow,
} from "@/services/admin.service";
import { VaiTro } from "@/types";
import styles from "./notification.module.css";

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
  const [form, setForm] = useState({
    tieude: initial?.tieude ?? "",
    noidung: initial?.noidung ?? "",
    loai: initial?.loai ?? "Chung",
    doituong: initial?.doituong ?? "Tatca",
    malop: initial?.malop ?? "",
    maphancong: initial?.maphancong ?? "",
    ngayhethan: initial?.ngayhethan?.split("T")[0] ?? "",
    ghim: initial?.ghim ?? false,
  });

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
          <label>Ngày hết hạn</label>
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
                [{p.maphancong}] {p.monhoc?.tenmon} - {p.giangvien?.hoten} ({p.lop?.tenlop})
              </option>
            ))}
          </select>
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
          onClick={() => onSubmit(form)}
          disabled={loading}
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
  const router = useRouter();

  const [list, setList] = useState<ThongbaoRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [phancongs, setPhancongs] = useState<PhanCongRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete";
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
  }, [search, filterType, filterTarget, page]);

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
              onChange={(e) => setFilterType(e.target.value)}
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
              onChange={(e) => setFilterTarget(e.target.value)}
            >
              <option value="">-- Tất cả đối tượng --</option>
              <option value="Tatca">Tất cả</option>
              <option value="GiangVien">Giảng viên</option>
              <option value="SinhVien">Sinh viên</option>
            </select>
            {(search || filterTarget || filterType ) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterTarget("");
                  setFilterType("");
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
              {list.map((notif) => (
                <div
                  key={notif.mathongbao}
                  className={`${styles.card} ${notif.ghim ? styles.cardPinned : ""}`}
                >
                  {notif.ghim && (
                    <div className={styles.pinIcon} title="Đã ghim">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11V22H13V16H18V14L16 12Z" />
                      </svg>
                    </div>
                  )}
                  <span
                    className={`${styles.cardType} ${getLoaiClass(notif.loai)}`}
                  >
                    {notif.loai}
                  </span>
                  <h3 className={styles.cardTitle}>{notif.tieude}</h3>
                  <p className={styles.cardContent}>{notif.noidung}</p>

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
                        {new Date(notif.ngaytao).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => {
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
                        onClick={() => {
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
              ))}
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
    </DashboardShell>
  );
}
