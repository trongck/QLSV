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
import { usePhongHoc, type PhongHocRow, type RoomSchedule, type RoomUtilization } from "@/hooks/admin/usePhonghoc";
import { VaiTro, LoaiPhongHoc } from "@/types";
import {
  PhongHocForm,
  ConflictCheckerForm,
  RoomTimetableModal,
  ROOM_TYPE_LABEL,
  ROOM_TYPE_BADGE,
  THU_LABELS,
} from "@/components/admin/RoomForms";




// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRoomsPage() {
  const { user, loading } = useAuth();
  const {
    getPhongHoc,
    createPhongHoc,
    updatePhongHoc,
    deletePhongHoc,
    getRoomSchedules,
    getRoomUtilization,
    checkRoomConflict,
  } = usePhongHoc();
  const router = useRouter();

  const [list, setList] = useState<PhongHocRow[]>([]);
  const [utilizationList, setUtilizationList] = useState<RoomUtilization[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [tkLoading, setTkLoading] = useState(true);

  type ModalMode = "create" | "edit" | "delete" | "timetable" | "conflict";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: PhongHocRow;
    schedules?: RoomSchedule[];
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
      const rooms = await getPhongHoc();
      setList(rooms);

      const utils = await getRoomUtilization();
      setUtilizationList(utils);
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu phòng học:", e);
    } finally {
      setTkLoading(false);
    }
  }, [getPhongHoc, getRoomUtilization]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (loading || !user) return null;

  // Filtered rooms
  const filteredRooms = list.filter((r) => {
    const matchesSearch = r.maphong.toLowerCase().includes(search.toLowerCase());
    const matchesType = !filterType || r.loaiphong === filterType;
    return matchesSearch && matchesType;
  });

  // Totals
  const totalRooms = list.length;
  const totalSeats = list.reduce((acc, r) => acc + r.suchua, 0);
  const averageUtilization = utilizationList.length
    ? Math.round(utilizationList.reduce((acc, r) => acc + r.utilizationRate, 0) / utilizationList.length)
    : 0;

  async function handleSubmit(form: any) {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updatePhongHoc(modal.item.maphong, {
          loaiphong: form.loaiphong,
          suchua: form.suchua,
        });
      } else {
        await createPhongHoc(form);
      }
      setModal(null);
      loadData();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Đã xảy ra lỗi hệ thống.");
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete() {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deletePhongHoc(modal.item.maphong);
      setModal(null);
      loadData();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá phòng học.");
    } finally {
      setMutating(false);
    }
  }

  async function handleOpenTimetable(room: PhongHocRow) {
    setTkLoading(true);
    try {
      const scheds = await getRoomSchedules(room.maphong);
      setModal({
        mode: "timetable",
        item: room,
        schedules: scheds,
      });
    } catch (e: any) {
      alert("Không thể tải thời khoá biểu: " + e.message);
    } finally {
      setTkLoading(false);
    }
  }

  async function handleCheckConflict(params: { thutrongtuan: number; tietbatdau: number; tietketthuc: number }) {
    if (!modal?.item) return;
    return checkRoomConflict({
      maphong: modal.item.maphong,
      thutrongtuan: params.thutrongtuan,
      tietbatdau: params.tietbatdau,
      tietketthuc: params.tietketthuc,
    });
  }

  return (
    <DashboardShell pageTitle="Quản lý Phòng học">
      <div className="animate-fadeInUp flex flex-col gap-5">
        <div className="flex justify-between items-center flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch mb-2">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Phòng học</h1>
            <p className="text-xs text-fg-subtle mt-1">
              Cấu hình thông tin phòng học, sức chứa, kiểm tra lịch trống và thống kê sử dụng
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm phòng học
          </button>
        </div>

        {/* Dashboard Room Stats Card */}
        <div className="mb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#EAD9CB] rounded-2xl p-5 flex flex-col gap-1.5 shadow-[0_2px_4px_rgba(45,27,20,0.02)]">
              <span className="text-2xl font-bold text-[#C25450]">{totalRooms}</span>
              <span className="text-xs text-fg-subtle font-medium">Tổng số phòng học</span>
            </div>
            <div className="bg-white border border-[#EAD9CB] rounded-2xl p-5 flex flex-col gap-1.5 shadow-[0_2px_4px_rgba(45,27,20,0.02)]">
              <span className="text-2xl font-bold text-[#C25450]">{totalSeats}</span>
              <span className="text-xs text-fg-subtle font-medium">Tổng chỗ ngồi cung cấp</span>
            </div>
            <div className="bg-white border border-[#EAD9CB] rounded-2xl p-5 flex flex-col gap-1.5 shadow-[0_2px_4px_rgba(45,27,20,0.02)]">
              <span className="text-2xl font-bold text-[#C25450]">{averageUtilization}%</span>
              <span className="text-xs text-fg-subtle font-medium">Hiệu suất sử dụng TB</span>
              <div className="mt-1 bg-gray-200 rounded-full h-1.5 overflow-hidden w-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${averageUtilization}%`,
                    backgroundColor: averageUtilization > 60 ? "#EF4444" : averageUtilization > 15 ? "#10B981" : "#3B82F6",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search & filters */}
        <section className="card" style={{ padding: 0 }}>
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch bg-[#FEFAE3] rounded-t-2xl">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm mã phòng..."
            />
            <select
              className="p-[9px_12px] border-[1.5px] border-[#EAD9CB] rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả loại phòng</option>
              {Object.values(LoaiPhongHoc).map((t) => (
                <option key={t} value={t}>
                  {ROOM_TYPE_LABEL[t]}
                </option>
              ))}
            </select>

            {(search || filterType) && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
                onClick={() => {
                  setSearch("");
                  setFilterType("");
                }}
              >
                ✕ Xoá bộ lọc
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
                    <th>Mã phòng</th>
                    <th>Loại phòng</th>
                    <th>Sức chứa</th>
                    <th>Hiệu suất sử dụng</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => {
                    const util = utilizationList.find((u) => u.maphong === room.maphong);
                    const rate = util ? util.utilizationRate : 0;
                    const status = util ? util.status : "Idle";

                    let statusBadgeClass = "bg-gray-100 text-gray-700 border border-gray-300/20";
                    if (status === "Healthy") statusBadgeClass = "bg-[#D1FAE5] text-[#065F46] border border-emerald-500/20";
                    else if (status === "Underutilized") statusBadgeClass = "bg-[#DBEAFE] text-[#1E40AF] border border-blue-500/20";
                    else if (status === "Overutilized") statusBadgeClass = "bg-[#FEE2E2] text-[#991B1B] border border-red-500/20";

                    let barColorClass = "bg-gray-500";
                    if (status === "Healthy") barColorClass = "bg-emerald-500";
                    else if (status === "Underutilized") barColorClass = "bg-blue-500";
                    else if (status === "Overutilized") barColorClass = "bg-red-500";

                    return (
                      <tr key={room.maphong}>
                        <td style={{ fontWeight: 700, color: "#2D1B14" }}>{room.maphong}</td>
                        <td>
                          <span className={`badge ${ROOM_TYPE_BADGE[room.loaiphong as LoaiPhongHoc] ?? "badge-peach"}`}>
                            {ROOM_TYPE_LABEL[room.loaiphong as LoaiPhongHoc] ?? room.loaiphong}
                          </span>
                        </td>
                        <td>
                          <strong>{room.suchua}</strong> chỗ ngồi
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5 min-w-[150px]">
                            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-xs font-semibold w-8 text-right">{rate}%</span>
                            <span className={`badge ${statusBadgeClass}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                              {status === "Overutilized"
                                ? "Quá tải"
                                : status === "Healthy"
                                  ? "Tốt"
                                  : status === "Underutilized"
                                    ? "Ít dùng"
                                    : "Trống"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1.5 items-center">
                            <button
                              className="btn-primary"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => handleOpenTimetable(room)}
                            >
                              Xem lịch
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => setModal({ mode: "conflict", item: room })}
                            >
                              Kiểm tra trống
                            </button>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: room });
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              className="btn-danger"
                              style={{ fontSize: 11, padding: "4px 8px" }}
                              onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: room });
                              }}
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filteredRooms.length && <EmptyState />}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {(modal?.mode === "create" || modal?.mode === "edit") && (
        <AdminModal
          title={modal.mode === "create" ? "Thêm phòng học mới" : "Chỉnh sửa phòng học"}
          onClose={() => setModal(null)}
        >
          <PhongHocForm
            initial={modal.item}
            isEdit={modal.mode === "edit"}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal title="Xoá phòng học" onClose={() => setModal(null)} size="sm">
          <ConfirmDelete
            label={`Phòng học: ${modal.item.maphong}`}
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

      {modal?.mode === "timetable" && modal.item && modal.schedules && (
        <AdminModal title={`Thời khóa biểu phòng học - ${modal.item.maphong}`} onClose={() => setModal(null)} size="lg">
          <RoomTimetableModal maphong={modal.item.maphong} schedules={modal.schedules} />
        </AdminModal>
      )}

      {modal?.mode === "conflict" && modal.item && (
        <AdminModal title={`Kiểm tra lịch trùng - ${modal.item.maphong}`} onClose={() => setModal(null)}>
          <ConflictCheckerForm maphong={modal.item.maphong} onCheck={handleCheckConflict} loading={mutating} />
        </AdminModal>
      )}
    </DashboardShell>
  );
}
