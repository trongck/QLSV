"use client";

import { useEffect, useState, useCallback } from "react";
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
  useSinhVien,
  type SinhVienRow,
} from "@/hooks/admin/useSinhVien/useSinhvien";
import { useKhoa, type KhoaRow } from "@/hooks/admin/useKhoa";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { VaiTro, TrangThaiSinhVien } from "@/types";
import {
  validateSinhVienCreate,
  validateSinhVienUpdate,
  firstError,
} from "@/lib/validation/admin.validation";
import ImportModal from "@/components/admin/ImportModal";
import { CreateForm, EditForm } from "@/components/admin/StudentForms";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TrangThaiSinhVien, string> = {
  [TrangThaiSinhVien.Danghoc]: "Đang học",
  [TrangThaiSinhVien.Baoluu]: "Bảo lưu",
  [TrangThaiSinhVien.Thoi]: "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};
const STATUS_BADGE: Record<TrangThaiSinhVien, string> = {
  [TrangThaiSinhVien.Danghoc]: "badge-green",
  [TrangThaiSinhVien.Baoluu]: "badge-yellow",
  [TrangThaiSinhVien.Thoi]: "badge-red",
  [TrangThaiSinhVien.Totnghiep]: "badge-blue",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const { user, loading } = useAuth();
  const { getSinhVien, createSinhVien, updateSinhVien, deleteSinhVien } =
    useSinhVien();
  const { getKhoa } = useKhoa();
  const { getLop } = useLop();
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">
              Quản lý Sinh viên
            </h1>
            <p className="text-xs text-fg-subtle mt-1">
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
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm MSSV hoặc tên…"
            />
            <select
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary min-w-[130px] max-sm:w-full"
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
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary min-w-[130px] max-sm:w-full"
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
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary min-w-[130px] max-sm:w-full"
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
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
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
                <div className="w-full overflow-x-auto">
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
                              className={`badge ${STATUS_BADGE[sv.trangthai as TrangThaiSinhVien] ?? "badge-peach"}`}
                            >
                              {STATUS_LABEL[
                                sv.trangthai as TrangThaiSinhVien
                              ] ?? sv.trangthai}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1.5">
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
