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
} from "@/components/admin/AdminTable";
import { useHocky, type HockyRow } from "@/hooks/admin/useHocky";
import { VaiTro } from "@/types";
import { HockyForm } from "@/components/admin/SemesterForm";




// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSemestersPage() {
  const { user, loading } = useAuth();
  const { getHocky, createHocky, updateHocky, deleteHocky, activateHocky } =
    useHocky();
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        <div className="flex justify-between items-center flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch mb-2">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Học kỳ</h1>
            <p className="text-xs text-fg-subtle mt-1">
              Thiết lập thời gian và học kỳ hiện tại cho hệ thống
            </p>
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
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch bg-[#FEFAE3] rounded-t-2xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm tên học kỳ..."
            />
            <input
              type="number"
              className="p-[9px_12px] border-[1.5px] border-[#EAD9CB] rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
              placeholder="Năm học..."
              value={filterNam ?? ""}
              onChange={(e) =>
                setFilterNam(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />

            {(search || filterNam) && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
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
            <div className="w-full overflow-x-auto">
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
                    const isCurrent = hk.danghieuluc;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const startDate = hk.ngaybatdau ? new Date(hk.ngaybatdau) : null;
                    const isFuture = !isCurrent && startDate !== null && startDate > today;
                    const isOld = !isCurrent && !isFuture;

                    return (
                      <tr key={hk.mahocky}>
                        <td style={{ fontWeight: 600 }}>{hk.tenhocky}</td>
                        <td>
                          {hk.ngaybatdau
                            ? new Date(hk.ngaybatdau).toLocaleDateString(
                                "vi-VN",
                              )
                            : "?"}{" "}
                          -{" "}
                          {hk.ngayketthuc
                            ? new Date(hk.ngayketthuc).toLocaleDateString(
                                "vi-VN",
                              )
                            : "?"}
                        </td>
                        <td>
                          {isCurrent ? (
                            <span className="bg-[#D1FAE5] text-[#047857] p-[4px_10px] rounded-full text-xs font-semibold border border-[#047857]/20">
                              Đang hiệu lực
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-500 p-[4px_10px] rounded-full text-xs font-semibold border border-gray-500/20">
                              Không hiệu lực
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            {/* Học kỳ tương lai: Kích hoạt, Sửa, Xoá */}
                            {isFuture && (
                              <>
                                <button
                                  className="btn-primary"
                                  style={{ fontSize: 11, padding: "4px 8px" }}
                                  onClick={() =>
                                    setModal({ mode: "activate", item: hk })
                                  }
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
          title={
            modal.mode === "create" ? "Thêm học kỳ mới" : "Chỉnh sửa học kỳ"
          }
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
          {mutError && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              {mutError}
            </p>
          )}
        </AdminModal>
      )}

      {modal?.mode === "activate" && modal.item && (
        <AdminModal
          title="Kích hoạt học kỳ"
          onClose={() => setModal(null)}
          size="sm"
        >
          <div style={{ padding: "10px 0" }}>
            <p>
              Bạn có chắc muốn kích hoạt <strong>{modal.item.tenhocky}</strong>?
            </p>
            <p style={{ fontSize: 13, color: "#8B6F5F", marginTop: 8 }}>
              Các học kỳ khác sẽ tự động bị huỷ kích hoạt.
            </p>
          </div>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => setModal(null)}
              disabled={mutating}
            >
              Huỷ
            </button>
            <button
              className="btn-primary"
              onClick={handleActivate}
              disabled={mutating}
            >
              {mutating ? "Đang xử lý..." : "Xác nhận kích hoạt"}
            </button>
          </div>
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
