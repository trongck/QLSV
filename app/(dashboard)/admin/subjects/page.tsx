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
import { SubjectForm } from "@/components/admin/SubjectForm";




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
      <div className="animate-fadeInUp flex flex-col gap-5">
        <div className="flex justify-between items-start flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Môn học</h1>
            <p className="text-xs text-fg-subtle mt-1">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FFF0CD] p-5 border border-[#FFDBB6] rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold text-fg-subtle">Tổng số môn</span>
            <span className="text-2xl font-extrabold text-fg">{totalAll}</span>
          </div>
          <div
            className="bg-[#FBD9D9] p-5 border border-[#FFB6B6] rounded-2xl flex flex-col gap-2"
          >
            <span className="text-xs font-semibold text-fg-subtle">Môn bắt buộc</span>
            <span className="text-2xl font-extrabold text-fg">{cReq}</span>
          </div>
          <div
            className="bg-[#FEFAE3] p-5 border border-[#EAD9CB] rounded-2xl flex flex-col gap-2"
          >
            <span className="text-xs font-semibold text-fg-subtle">Môn tự chọn</span>
            <span className="text-2xl font-extrabold text-fg">{cOpt}</span>
          </div>
        </div>

        <section className="card" style={{ padding: 0 }}>
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch bg-[#FEFAE3] rounded-t-2xl">
            <SearchBar
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Mã hoặc tên môn..."
            />
            <select
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
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
            <div className="w-full overflow-x-auto">
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
                        <span className="font-mono bg-[#FBD9D9] text-[#C25450] p-0.5 px-1.5 rounded text-xs font-bold">{m.mamon}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.tenmon}</td>
                      <td>{m.sotinchi}</td>
                      <td>{m.khoa?.tenkhoa || "—"}</td>
                      <td>
                        {m.batbuoc ? (
                          <span className="badge badge-red">Bắt buộc</span>
                        ) : (
                          <span className="badge badge-green">Tự chọn</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1.5">
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
