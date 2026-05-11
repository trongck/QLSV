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
import { VaiTro } from "@/types";
import styles from "./room.module.css";

const ROOM_TYPE_LABEL: Record<string, string> = {
  Lythuyet: "Lý thuyết",
  Thuchanh: "Thực hành",
  Online: "Trực tuyến",
};

const ROOM_TYPE_BADGE: Record<string, string> = {
  Lythuyet: "badge-green",
  Thuchanh: "badge-yellow",
  Online: "badge-red",
};

const THU_LABELS: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

// ─── Room Form ───────────────────────────────────────────────────────────────
function PhongHocForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isEdit = false,
}: {
  initial?: Partial<PhongHocRow>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  isEdit?: boolean;
}) {
  const [form, setForm] = useState({
    maphong: initial?.maphong ?? "",
    loaiphong: initial?.loaiphong ?? "Lythuyet",
    suchua: initial?.suchua ?? 50,
  });

  return (
    <>
      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Mã phòng học *</label>
          <input
            value={form.maphong}
            onChange={(e) => setForm({ ...form, maphong: e.target.value })}
            placeholder="VD: A1-302, LAB-02"
            disabled={isEdit}
          />
          {isEdit && <small style={{ color: "#8B6F5F" }}>Mã phòng học không thể thay đổi sau khi tạo.</small>}
        </div>
        <div className="field">
          <label>Loại phòng *</label>
          <select
            value={form.loaiphong}
            onChange={(e) => setForm({ ...form, loaiphong: e.target.value })}
          >
            <option value="Lythuyet">Lý thuyết</option>
            <option value="Thuchanh">Thực hành</option>
            <option value="Online">Trực tuyến</option>
          </select>
        </div>
        <div className="field">
          <label>Sức chứa (chỗ ngồi) *</label>
          <input
            type="number"
            min={1}
            value={form.suchua}
            onChange={(e) => setForm({ ...form, suchua: Number(e.target.value) })}
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
          {loading ? "Đang lưu…" : isEdit ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </>
  );
}

// ─── Conflict Checker Form ───────────────────────────────────────────────────
function ConflictCheckerForm({
  maphong,
  onCheck,
  loading,
}: {
  maphong: string;
  onCheck: (params: { thutrongtuan: number; tietbatdau: number; tietketthuc: number }) => Promise<any>;
  loading: boolean;
}) {
  const [thutrongtuan, setThutrongtuan] = useState(2);
  const [tietbatdau, setTietbatdau] = useState(1);
  const [tietketthuc, setTietketthuc] = useState(3);
  const [result, setResult] = useState<{ checked: boolean; isConflict: boolean; conflicts: any[] } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    if (tietbatdau > tietketthuc) {
      setError("Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc.");
      return;
    }
    try {
      const res = await onCheck({ thutrongtuan, tietbatdau, tietketthuc });
      setResult({
        checked: true,
        isConflict: res.isConflict,
        conflicts: res.conflicts || [],
      });
    } catch (e: any) {
      setError(e.message || "Lỗi kiểm tra xung đột.");
    }
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <p style={{ marginBottom: 16 }}>
        Kiểm tra tình trạng trống của phòng học <strong>{maphong}</strong> tại thời gian định sẵn:
      </p>

      {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Thứ trong tuần *</label>
          <select value={thutrongtuan} onChange={(e) => setThutrongtuan(Number(e.target.value))}>
            <option value={2}>Thứ 2</option>
            <option value={3}>Thứ 3</option>
            <option value={4}>Thứ 4</option>
            <option value={5}>Thứ 5</option>
            <option value={6}>Thứ 6</option>
            <option value={7}>Thứ 7</option>
            <option value={8}>Chủ nhật</option>
          </select>
        </div>
        <div className="field">
          <label>Tiết bắt đầu *</label>
          <input
            type="number"
            min={1}
            max={12}
            value={tietbatdau}
            onChange={(e) => setTietbatdau(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Tiết kết thúc *</label>
          <input
            type="number"
            min={1}
            max={12}
            value={tietketthuc}
            onChange={(e) => setTietketthuc(Number(e.target.value))}
          />
        </div>
      </div>

      <button className="btn-primary" style={{ width: "100%" }} onClick={handleSubmit} disabled={loading}>
        {loading ? "Đang kiểm tra..." : "Kiểm tra phòng trống"}
      </button>

      {result && result.checked && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 10,
            background: result.isConflict ? "#FFF5F5" : "#F0FDF4",
            border: result.isConflict ? "1px dashed #C25450" : "1px dashed #10B981",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: result.isConflict ? "#991B1B" : "#065F46",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {result.isConflict ? "PHÒNG ĐÃ BỊ TRÙNG LỊCH" : "PHÒNG ĐANG TRỐNG"}
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#8B6F5F" }}>
            {result.isConflict
              ? `Phòng học bận vì có lớp đang giảng dạy vào thời điểm này:`
              : `Phòng học hoàn toàn trống và sẵn sàng để phân công giảng dạy.`}
          </p>

          {result.isConflict && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {result.conflicts.map((lh: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #EAD9CB",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <strong style={{ color: "#2D1B14" }}>
                    {lh.phancong?.monhoc?.tenmon ?? "—"}
                  </strong>
                  <div style={{ color: "#8B6F5F", marginTop: 2 }}>
                    Lớp: {lh.phancong?.lop?.tenlop ?? "—"} • Tiết: {lh.tietbatdau}-{lh.tietketthuc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timetable Visualizer ────────────────────────────────────────────────────
function RoomTimetableModal({
  maphong,
  schedules,
}: {
  maphong: string;
  schedules: RoomSchedule[];
}) {
  // Group schedules by thutrongtuan
  const grouped: Record<number, RoomSchedule[]> = {};
  [2, 3, 4, 5, 6, 7, 8].forEach((thu) => {
    grouped[thu] = schedules
      .filter((s) => s.thutrongtuan === thu)
      .sort((a, b) => a.tietbatdau - b.tietbatdau);
  });

  return (
    <div>
      <p style={{ marginBottom: 16 }}>
        Thời khóa biểu chi tiết trong học kỳ hiện tại của phòng <strong>{maphong}</strong>:
      </p>

      <div className={styles.timetableGrid}>
        {[2, 3, 4, 5, 6, 7, 8].map((thu, index, arr) => {
          const isLast = index === arr.length - 1;
          const dayClasses = grouped[thu] || [];

          return (
            <div className={styles.timetableRow} key={thu}>
              <div className={`${styles.timetableDayLabel} ${isLast ? styles.timetableDayLabelLast : ""}`}>
                {THU_LABELS[thu]}
              </div>
              <div className={`${styles.timetableSlots} ${isLast ? styles.timetableSlotsLast : ""}`}>
                {dayClasses.length === 0 ? (
                  <span className={styles.emptyTimetableDay}>Không có lịch học</span>
                ) : (
                  dayClasses.map((cl) => (
                    <div key={cl.malichhoc} className={styles.timetableClassItem}>
                      <div className={styles.timetableClassTitle}>{cl.monhoc}</div>
                      <div className={styles.timetableClassMeta}>
                        Tiết: <strong>{cl.tietbatdau}-{cl.tietketthuc}</strong> • Lớp: {cl.lop} • GV: {cl.giangvien}
                      </div>
                      {cl.ghichu && <div style={{ fontSize: 10, fontStyle: "italic", marginTop: 2, color: "#8B6F5F" }}>* Ghi chú: {cl.ghichu}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      <div className={`animate-fadeInUp ${styles.page}`}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Phòng học</h1>
            <p className={styles.pageSub}>
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
        <div className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalRooms}</span>
              <span className={styles.statLabel}>Tổng số phòng học</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalSeats}</span>
              <span className={styles.statLabel}>Tổng chỗ ngồi cung cấp</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{averageUtilization}%</span>
              <span className={styles.statLabel}>Hiệu suất sử dụng TB</span>
              <div className={styles.statProgressWrap}>
                <div
                  className={styles.statProgressBar}
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
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm mã phòng..."
            />
            <select
              className={styles.filter}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tất cả loại phòng</option>
              <option value="Lythuyet">Lý thuyết</option>
              <option value="Thuchanh">Thực hành</option>
              <option value="Online">Trực tuyến</option>
            </select>

            {(search || filterType) && (
              <button
                className={styles.clearFilter}
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
            <div className={styles.tableWrap}>
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

                    let statusBadgeClass = styles.badgeIdle;
                    if (status === "Healthy") statusBadgeClass = styles.badgeHealthy;
                    else if (status === "Underutilized") statusBadgeClass = styles.badgeUnder;
                    else if (status === "Overutilized") statusBadgeClass = styles.badgeOver;

                    let barColorClass = styles.bgIdle;
                    if (status === "Healthy") barColorClass = styles.bgHealthy;
                    else if (status === "Underutilized") barColorClass = styles.bgUnder;
                    else if (status === "Overutilized") barColorClass = styles.bgOver;

                    return (
                      <tr key={room.maphong}>
                        <td style={{ fontWeight: 700, color: "#2D1B14" }}>{room.maphong}</td>
                        <td>
                          <span className={`badge ${ROOM_TYPE_BADGE[room.loaiphong] ?? "badge-peach"}`}>
                            {ROOM_TYPE_LABEL[room.loaiphong] ?? room.loaiphong}
                          </span>
                        </td>
                        <td>
                          <strong>{room.suchua}</strong> chỗ ngồi
                        </td>
                        <td>
                          <div className={styles.utilProgressContainer}>
                            <div className={styles.utilBarOuter}>
                              <div className={`${styles.utilBarInner} ${barColorClass}`} style={{ width: `${rate}%` }} />
                            </div>
                            <span className={styles.utilText}>{rate}%</span>
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
                          <div className={styles.actions}>
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
