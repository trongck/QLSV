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
import { useThongbao, type ThongbaoRow } from "@/hooks/admin/useThongbao";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { usePhanCong, type PhanCongRow } from "@/hooks/admin/usePhancong";
import { VaiTro, LoaiThongBao, DoiTuongThongBao } from "@/types";
import {
  NotificationForm,
  getNotificationStatus,
  parseNotificationContent,
} from "@/components/admin/NotificationForms";

const NOTIFICATION_TYPE_LABEL: Record<LoaiThongBao, string> = {
  [LoaiThongBao.Chung]: "Chung",
  [LoaiThongBao.Hoctap]: "Học tập",
  [LoaiThongBao.Thoikhoabieu]: "Thời khóa biểu",
  [LoaiThongBao.Diem]: "Điểm số",
  [LoaiThongBao.Baitap]: "Bài tập",
  [LoaiThongBao.Tailieu]: "Tài liệu",
  [LoaiThongBao.Khancap]: "Khẩn cấp",
};

const NOTIFICATION_TARGET_LABEL: Record<DoiTuongThongBao, string> = {
  [DoiTuongThongBao.Tatca]: "Tất cả",
  [DoiTuongThongBao.GiangVien]: "Giảng viên",
  [DoiTuongThongBao.SinhVien]: "Sinh viên",
};




// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getLop } = useLop();
  const { getPhanCong } = usePhanCong();
  const { getThongbao, createThongbao, updateThongbao, deleteThongbao } =
    useThongbao();
  const router = useRouter();

  const [list, setList] = useState<ThongbaoRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [phancongs, setPhancongs] = useState<PhanCongRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterTarget, setFilterTarget] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete" | "view";
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
        trangthai: filterStatus,
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
  }, [search, filterType, filterTarget, filterStatus, page]);

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
    if (loai === "Khancap") return "bg-[#FBD9D9] text-[#C25450]";
    if (loai === "Hoctap") return "bg-[#E3F2FD] text-[#1976D2]";
    return "bg-[#E8F5E9] text-[#2E7D32]";
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        <div className="flex justify-between items-start flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Thông báo</h1>
            <p className="text-xs text-fg-subtle mt-1">
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
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch bg-[#FFF0CD] rounded-t-2xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm tiêu đề..."
            />
            <select
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors focus:border-primary max-sm:w-full"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả loại --</option>
              {Object.values(LoaiThongBao).map((type) => (
                <option key={type} value={type}>
                  {NOTIFICATION_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            <select
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors focus:border-primary max-sm:w-full"
              value={filterTarget}
              onChange={(e) => {
                setFilterTarget(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả đối tượng --</option>
              {Object.values(DoiTuongThongBao).map((tgt) => (
                <option key={tgt} value={tgt}>
                  {NOTIFICATION_TARGET_LABEL[tgt]}
                </option>
              ))}
            </select>
            <select
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors focus:border-primary max-sm:w-full"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="Active">Đang hiệu lực</option>
              <option value="Scheduled">Hẹn giờ phát sóng</option>
              <option value="Expired">Đã hết hạn</option>
            </select>
            {(search || filterTarget || filterType || filterStatus) && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
                onClick={() => {
                  setSearch("");
                  setFilterTarget("");
                  setFilterType("");
                  setFilterStatus("");
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 max-sm:p-3">
              {list.map((notif) => {
                const parsed = parseNotificationContent(notif.noidung);
                const status = getNotificationStatus(
                  notif.ngaytao,
                  notif.ngayhethan,
                );

                return (
                  <div
                    key={notif.mathongbao}
                    className={`bg-white border rounded-2xl p-5 flex flex-col gap-3.5 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${notif.ghim ? "border-2 border-[#C25450] bg-[#FEFAE3]" : "border-[#FFDBB6]"} ${status === "Expired" ? "opacity-85 bg-gray-50" : ""}`}
                    onClick={() => setModal({ mode: "view", item: notif })}
                    style={{ cursor: "pointer" }}
                    title="Click để xem toàn bộ nội dung"
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: "8px",
                      }}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase p-[2px_8px] rounded-md w-fit ${getLoaiClass(notif.loai)}`}
                      >
                        {notif.loai}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {status === "Active" && (
                          <span
                            className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]"
                          >
                            Đang hiệu lực
                          </span>
                        )}
                        {status === "Scheduled" && (
                          <span
                            className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#FFF8E1] text-[#FF8F00] border border-[#FFE082]"
                          >
                            Hẹn giờ gửi
                          </span>
                        )}
                        {status === "Expired" && (
                          <span
                            className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#ECEFF1] text-[#546E7A] border border-[#B0BEC5]"
                          >
                            Đã hết hạn
                          </span>
                        )}
                        {notif.ghim && (
                          <span className="text-xs ml-0.5" title="Đã ghim">
                            📌
                          </span>
                        )}
                      </div>
                    </div>

                    {parsed.imageUrl && (
                      <div className="w-full h-40 overflow-hidden rounded-xl border border-[#FFDBB6]">
                        <img
                          src={parsed.imageUrl}
                          alt={notif.tieude}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    )}

                    <h3 className="text-[17px] font-bold text-fg line-clamp-1">{notif.tieude}</h3>
                    <p className="text-sm text-[#5D4037] line-clamp-3 leading-relaxed">{parsed.text}</p>

                    <div className="mt-auto pt-3.5 border-t border-[#F5E6DA] flex justify-between items-center">
                      <div className="flex flex-col gap-1">
                        <span className="text-[12px] text-fg-subtle flex items-center gap-1">
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
                        <span className="text-[12px] text-fg-subtle flex items-center gap-1">
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
                          {(() => {
                            const formatted = notif.ngaytao.replace(" ", "T");
                            const parts = formatted.split("T");
                            const [year, month, day] = parts[0].split("-");
                            const timePart = parts[1]?.slice(0, 5) ?? "00:00";
                            return `${day}/${month}/${year} ${timePart}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 hover:bg-[#FEFAE3] hover:text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
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
                          className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 hover:bg-[#FEFAE3] hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
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
                );
              })}
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

      {modal?.mode === "view" &&
        modal.item &&
        (() => {
          const parsed = parseNotificationContent(modal.item.noidung);
          const status = getNotificationStatus(
            modal.item.ngaytao,
            modal.item.ngayhethan,
          );
          return (
            <AdminModal
              title="Chi tiết thông báo"
              onClose={() => setModal(null)}
              size="md"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    className={`text-[11px] font-bold uppercase p-[2px_8px] rounded-md w-fit ${getLoaiClass(modal.item.loai)}`}
                  >
                    {modal.item.loai}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {status === "Active" && (
                      <span
                        className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]"
                      >
                        Đang hiệu lực
                      </span>
                    )}
                    {status === "Scheduled" && (
                      <span
                        className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#FFF8E1] text-[#FF8F00] border border-[#FFE082]"
                      >
                        Hẹn giờ gửi
                      </span>
                    )}
                    {status === "Expired" && (
                      <span
                        className="text-[11px] font-semibold p-[2px_6px] rounded-md inline-flex items-center bg-[#ECEFF1] text-[#546E7A] border border-[#B0BEC5]"
                      >
                        Đã hết hạn
                      </span>
                    )}
                    <span style={{ fontSize: "12px", color: "#8B6F5F" }}>
                      Phát sóng:{" "}
                      {(() => {
                        const formatted = modal.item.ngaytao.replace(" ", "T");
                        const parts = formatted.split("T");
                        const [year, month, day] = parts[0].split("-");
                        const timePart = parts[1]?.slice(0, 5) ?? "00:00";
                        return `${day}/${month}/${year} ${timePart}`;
                      })()}{" "}
                      bởi{" "}
                      <strong>{modal.item.admin?.hoten || "Hệ thống"}</strong>
                    </span>
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "#2D1B14",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {modal.item.tieude}
                </h2>

                {parsed.imageUrl && (
                  <div style={{ width: "100%" }}>
                    <img
                      src={parsed.imageUrl}
                      alt={modal.item.tieude}
                      className="w-full max-h-[280px] object-cover rounded-xl border-[1.5px] border-[#FFDBB6]"
                    />
                  </div>
                )}

                <div
                  style={{
                    background: "#FFF0CD",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#5D4037",
                    border: "1px solid #FFDBB6",
                  }}
                >
                  <strong>Đối tượng nhận:</strong>{" "}
                  {modal.item.doituong === "Tatca"
                    ? "Tất cả mọi người"
                    : modal.item.doituong === "GiangVien"
                      ? "Toàn bộ giảng viên"
                      : modal.item.doituong === "SinhVien"
                        ? "Toàn bộ sinh viên"
                        : modal.item.doituong === "Lop"
                          ? `Lớp hành chính: ${modal.item.malop}`
                          : `Lớp học phần: ${modal.item.maphancong}`}
                  {modal.item.ngayhethan && (
                    <span style={{ marginLeft: "12px" }}>
                      · <strong>Hết hạn:</strong>{" "}
                      {(() => {
                        const parts = modal.item.ngayhethan
                          .split("T")[0]
                          .split("-");
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      })()}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "#2D1B14",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                    background: "#FEFAE3",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    border: "1.5px solid #FFDBB6",
                    maxHeight: "40vh",
                    overflowY: "auto",
                  }}
                >
                  {parsed.text}
                </div>
              </div>
              <div
                className="modal-actions"
                style={{ borderTop: "none", marginTop: "12px", paddingTop: 0 }}
              >
                <button className="btn-primary" onClick={() => setModal(null)}>
                  Đóng
                </button>
              </div>
            </AdminModal>
          );
        })()}
    </DashboardShell>
  );
}
