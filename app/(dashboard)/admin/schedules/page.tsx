"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  getLichHoc,
  createLichHoc,
  updateLichHoc,
  deleteLichHoc,
  type LichHocRow,
} from "@/services/admin/lichhoc.service";
import { getPhanCong, type PhanCongRow } from "@/services/admin/phancong.service";
import { getHocky, type HockyRow } from "@/services/admin/hocky.service";
import { getLop, type LopRow } from "@/services/admin/lop.service";
import { VaiTro } from "@/types";
import styles from "./schedule.module.css";

// Helper to translate day of week to Vietnamese label
const getDayLabel = (thu: number) => {
  if (thu === 8) return "Chủ Nhật";
  return `Thứ ${thu}`;
};

// Helper to translate room type to Vietnamese label
const getRoomTypeLabel = (type: string | null) => {
  if (type === "Lythuyet") return "Lý thuyết";
  if (type === "Thuchanh") return "Thực hành";
  if (type === "Online") return "Trực tuyến";
  return "N/A";
};

// ─── Schedule Form Component ─────────────────────────────────────────────────
function ScheduleForm({
  initial,
  phancongs,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: Partial<LichHocRow>;
  phancongs: PhanCongRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    maphancong: initial?.maphancong ? String(initial.maphancong) : "",
    thutrongtuan: initial?.thutrongtuan ? String(initial.thutrongtuan) : "2",
    tietbatdau: initial?.tietbatdau ? String(initial.tietbatdau) : "1",
    tietketthuc: initial?.tietketthuc ? String(initial.tietketthuc) : "3",
    phonghoc: initial?.phonghoc ?? "",
    loaiphong: initial?.loaiphong ?? "Lythuyet",
    ghichu: initial?.ghichu ?? "",
  });

  const [localErr, setLocalErr] = useState("");

  const handleValidateAndSubmit = () => {
    setLocalErr("");
    if (!form.maphancong) return setLocalErr("Vui lòng chọn phân công giảng dạy.");
    
    const thu = parseInt(form.thutrongtuan);
    if (isNaN(thu) || thu < 2 || thu > 8) return setLocalErr("Thứ trong tuần không hợp lệ.");

    const tbd = parseInt(form.tietbatdau);
    const tkt = parseInt(form.tietketthuc);
    if (isNaN(tbd) || tbd < 1 || tbd > 15 || isNaN(tkt) || tkt < 1 || tkt > 15) {
      return setLocalErr("Tiết học phải thuộc khoảng từ 1 đến 15.");
    }
    if (tbd > tkt) {
      return setLocalErr("Tiết bắt đầu không thể lớn hơn tiết kết thúc.");
    }

    onSubmit({
      ...form,
      maphancong: parseInt(form.maphancong),
      thutrongtuan: thu,
      tietbatdau: tbd,
      tietketthuc: tkt,
    });
  };

  return (
    <>
      {(error || localErr) && <div className="error-msg">{error || localErr}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Phân công Giảng dạy (Lớp & Môn học) *</label>
          <select
            value={form.maphancong}
            onChange={(e) => setForm({ ...form, maphancong: e.target.value })}
            disabled={!!initial?.malichhoc} // Can't change assignment on edit
          >
            <option value="">-- Chọn phân công dạy học --</option>
            {phancongs.map((pc) => (
              <option key={pc.maphancong} value={pc.maphancong}>
                #{pc.maphancong} | {pc.monhoc?.tenmon} - {pc.giangvien?.hoten} ({pc.lop?.tenlop})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Thứ trong tuần *</label>
          <select
            value={form.thutrongtuan}
            onChange={(e) => setForm({ ...form, thutrongtuan: e.target.value })}
          >
            <option value="2">Thứ Hai</option>
            <option value="3">Thứ Ba</option>
            <option value="4">Thứ Tư</option>
            <option value="5">Thứ Năm</option>
            <option value="6">Thứ Sáu</option>
            <option value="7">Thứ Bảy</option>
            <option value="8">Chủ Nhật</option>
          </select>
        </div>

        <div className="field">
          <label>Loại phòng học *</label>
          <select
            value={form.loaiphong}
            onChange={(e) => setForm({ ...form, loaiphong: e.target.value })}
          >
            <option value="Lythuyet">Lý thuyết</option>
            <option value="Thuchanh">Thực hành</option>
            <option value="Online">Trực tuyến (Online)</option>
          </select>
        </div>

        <div className="field">
          <label>Tiết bắt đầu *</label>
          <select
            value={form.tietbatdau}
            onChange={(e) => setForm({ ...form, tietbatdau: e.target.value })}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                Tiết {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tiết kết thúc *</label>
          <select
            value={form.tietketthuc}
            onChange={(e) => setForm({ ...form, tietketthuc: e.target.value })}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                Tiết {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Phòng học {form.loaiphong !== "Online" ? "*" : "(Tùy chọn)"}</label>
          <input
            value={form.phonghoc}
            onChange={(e) => setForm({ ...form, phonghoc: e.target.value })}
            placeholder={form.loaiphong === "Online" ? "Học trực tuyến (Zoom/MS Teams)" : "Ví dụ: Phòng 502 - A2"}
          />
        </div>

        <div className="field full">
          <label>Ghi chú lịch học</label>
          <textarea
            rows={3}
            value={form.ghichu}
            onChange={(e) => setForm({ ...form, ghichu: e.target.value })}
            placeholder="Nhập thông tin ghi chú (nếu có)..."
          />
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={handleValidateAndSubmit}
          disabled={loading}
        >
          {loading ? "Đang xếp lịch..." : initial?.malichhoc ? "Cập nhật" : "Xếp lịch học"}
        </button>
      </div>
    </>
  );
}

// ─── Inner Component to safely read Search Params ─────────────────────────────
function AdminSchedulesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary data states
  const [list, setList] = useState<LichHocRow[]>([]);
  const [phancongs, setPhancongs] = useState<PhanCongRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [hockys, setHockys] = useState<HockyRow[]>([]);

  // UI representation mode: 'list' (Traditional table) | 'calendar' (Visual calendar grid)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filter & Pagination states
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterPc, setFilterPc] = useState(searchParams.get("maphancong") ?? "");
  const [filterThu, setFilterThu] = useState("");
  const [filterLop, setFilterLop] = useState("");
  const [filterHk, setFilterHk] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Mutating states
  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete";
    item?: LichHocRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  // Monitor query search parameters (e.g. shortcut filter from assignment page)
  useEffect(() => {
    const pcId = searchParams.get("maphancong");
    if (pcId) {
      setFilterPc(pcId);
    }
  }, [searchParams]);

  // Load lookups once authorized
  useEffect(() => {
    if (!authLoading && (!user || user.vaitro !== VaiTro.Admin)) {
      router.replace("/login");
    }

    if (user && user.vaitro === VaiTro.Admin) {
      getPhanCong(100)
        .then((res) => setPhancongs(res))
        .catch(() => {});
      getLop({ limit: 100 })
        .then((res) => setLops(res.data))
        .catch(() => {});
      getHocky()
        .then((res) => setHockys(res.data))
        .catch(() => {});
    }
  }, [user, authLoading, router]);

  // Load schedule lists
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getLichHoc({
        maphancong: filterPc,
        thutrongtuan: filterThu,
        malop: filterLop,
        mahocky: filterHk,
        phonghoc: filterRoom,
        page: viewMode === "list" ? page : undefined, // only paginate list view
        limit: viewMode === "list" ? 12 : 200, // retrieve more items for calendar visualization
      });
      setList(res.data);
      if (viewMode === "list") {
        setTotal(res.pagination.total);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [filterPc, filterThu, filterLop, filterHk, filterRoom, page, viewMode]);

  useEffect(() => {
    if (user && user.vaitro === VaiTro.Admin) {
      loadData();
    }
  }, [user, loadData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalSchedules = list.length;
    const theoryRooms = list.filter((item) => item.loaiphong === "Lythuyet").length;
    const practiceRooms = list.filter((item) => item.loaiphong === "Thuchanh").length;
    const onlineRooms = list.filter((item) => item.loaiphong === "Online").length;

    return {
      totalSchedules,
      theoryRooms,
      practiceRooms,
      onlineRooms,
    };
  }, [list]);

  // Calendar rendering configuration (Monday (2) to Sunday (8))
  const weekdays = [2, 3, 4, 5, 6, 7, 8];

  // Map schedules by weekdays for Visual Scheduler rendering
  const weekdaySchedules = useMemo(() => {
    const map: Record<number, LichHocRow[]> = {
      2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: []
    };
    list.forEach((item) => {
      if (map[item.thutrongtuan]) {
        map[item.thutrongtuan].push(item);
      }
    });
    // Sort schedules on each day by starting period
    Object.keys(map).forEach((k) => {
      map[Number(k)].sort((a, b) => a.tietbatdau - b.tietbatdau);
    });
    return map;
  }, [list]);

  if (authLoading || !user || user.vaitro !== VaiTro.Admin) return null;

  const handleSubmit = async (formData: any) => {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updateLichHoc(modal.item.malichhoc, formData);
      } else {
        await createLichHoc(formData);
      }
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Lỗi lưu cấu hình lịch học.");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteLichHoc(modal.item.malichhoc);
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Lỗi khi xóa lịch học.");
    } finally {
      setMutating(false);
    }
  };

  return (
    <DashboardShell pageTitle="Quản lý Lịch học">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header Section */}
        <div className={styles.header}>
          <div>
            {filterPc && (
              <button
                className="btn-secondary"
                onClick={() => router.push("/admin/assignments")}
                style={{
                  marginBottom: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" />
                  <polyline points="12 19 5 12 12 5" strokeWidth="2.5" />
                </svg>
                Quay lại danh sách Phân công
              </button>
            )}
            <h1 className={styles.title}>Quản lý Lịch học & Thời khóa biểu</h1>
            <p className={styles.subtitle}>
              Xếp lịch học, sắp xếp phòng học, tiết học và theo dõi thời khoá biểu toàn trường
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* View Mode Toggle Switch */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${viewMode === "list" ? styles.toggleActive : ""}`}
                onClick={() => {
                  setViewMode("list");
                  setPage(1);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Danh sách
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === "calendar" ? styles.toggleActive : ""}`}
                onClick={() => setViewMode("calendar")}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="3" x2="15" y2="21" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                </svg>
                Xếp lịch trực quan
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={() => {
                setMutError("");
                setModal({ mode: "create" });
              }}
            >
              + Xếp lịch học mới
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statOrange}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.totalSchedules}</div>
              <div className={styles.statLabel}>Lịch xếp tuần này</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statRed}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.theoryRooms}</div>
              <div className={styles.statLabel}>Lớp lý thuyết</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statYellow}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.practiceRooms}</div>
              <div className={styles.statLabel}>Lớp thực hành</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.statCream}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7a2 2 0 0 0-2.45-1.45L11 8 1 5v4l10 3 12-3z" />
                <path d="M23 11a2 2 0 0 0-2.45-1.45L11 12 1 9v4l10 3 12-3z" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.onlineRooms}</div>
              <div className={styles.statLabel}>Phòng học trực tuyến</div>
            </div>
          </div>
        </div>

        {/* Toolbar Filter Controls */}
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={filterRoom}
              onChange={setFilterRoom}
              placeholder="Tìm theo phòng học..."
            />

            <select
              className={styles.filterSelect}
              value={filterPc}
              onChange={(e) => setFilterPc(e.target.value)}
            >
              <option value="">-- Tất cả phân công dạy --</option>
              {phancongs.map((pc) => (
                <option key={pc.maphancong} value={pc.maphancong}>
                  [{pc.maphancong}] {pc.monhoc?.tenmon} - {pc.giangvien?.hoten}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterThu}
              onChange={(e) => setFilterThu(e.target.value)}
            >
              <option value="">-- Tất cả các ngày --</option>
              <option value="2">Thứ Hai</option>
              <option value="3">Thứ Ba</option>
              <option value="4">Thứ Tư</option>
              <option value="5">Thứ Năm</option>
              <option value="6">Thứ Sáu</option>
              <option value="7">Thứ Bảy</option>
              <option value="8">Chủ Nhật</option>
            </select>

            <select
              className={styles.filterSelect}
              value={filterLop}
              onChange={(e) => setFilterLop(e.target.value)}
            >
              <option value="">-- Tất cả lớp --</option>
              {lops.map((l) => (
                <option key={l.malop} value={l.malop}>
                  {l.tenlop}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterHk}
              onChange={(e) => setFilterHk(e.target.value)}
            >
              <option value="">-- Tất cả học kỳ --</option>
              {hockys.map((hk) => (
                <option key={hk.mahocky} value={hk.mahocky}>
                  {hk.tenhocky}
                </option>
              ))}
            </select>

            {(filterRoom || filterPc || filterThu || filterLop || filterHk) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setFilterRoom("");
                  setFilterPc("");
                  setFilterThu("");
                  setFilterLop("");
                  setFilterHk("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: "40px" }}>
              <TableSkeleton cols={7} rows={4} />
            </div>
          ) : list.length > 0 ? (
            <>
              {/* VIEW 1: Traditional List Table View */}
              {viewMode === "list" && (
                <div className={styles.tableContainer}>
                  <table className={styles.customTable}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Ngày học</th>
                        <th>Tiết học</th>
                        <th>Môn học / Lớp</th>
                        <th>Giảng viên</th>
                        <th>Phòng học</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item) => (
                        <tr key={item.malichhoc}>
                          <td><strong>#{item.malichhoc}</strong></td>
                          <td>
                            <span className="badge-purple" style={{ padding: "4px 8px", borderRadius: 6 }}>
                              {getDayLabel(item.thutrongtuan)}
                            </span>
                          </td>
                          <td>
                            <strong>Tiết {item.tietbatdau} - {item.tietketthuc}</strong>
                            <div style={{ fontSize: 11, color: "#8B6F5F", marginTop: 2 }}>
                              ({item.tietketthuc - item.tietbatdau + 1} tiết)
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.phancong?.monhoc?.tenmon}</div>
                            <span style={{ fontSize: 11, color: "#8B6F5F" }}>
                              Lớp: {item.phancong?.lop?.tenlop} | LHP: {item.phancong?.malophoc || "N/A"}
                            </span>
                          </td>
                          <td>{item.phancong?.giangvien?.hoten}</td>
                          <td>
                            <span className={`${styles.badge} ${item.loaiphong === "Online" ? styles.typeOnline : item.loaiphong === "Thuchanh" ? styles.typePractice : styles.typeTheory}`}>
                              {item.phonghoc || "Chưa xếp phòng"} ({getRoomTypeLabel(item.loaiphong)})
                            </span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={`${styles.iconBtn} ${styles.editBtn}`}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item });
                                }}
                                title="Sửa lịch học"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item });
                                }}
                                title="Xoá lịch học"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 2: Premium Visual Weekly Timetable Grid View */}
              {viewMode === "calendar" && (
                <div className={styles.calendarContainer}>
                  <div className={styles.timetable}>
                    <div className={styles.timeColHeader}>Thời gian</div>
                    {weekdays.map((thu) => (
                      <div key={thu} className={styles.dayColHeader}>
                        {getDayLabel(thu)}
                      </div>
                    ))}

                    {/* Simple rendering grouping schedule list per day column */}
                    <div className={styles.timeSlotLabel}>Cả ngày</div>
                    {weekdays.map((thu) => (
                      <div key={thu} className={styles.gridCell}>
                        {weekdaySchedules[thu].length > 0 ? (
                          weekdaySchedules[thu].map((item) => (
                            <div
                              key={item.malichhoc}
                              className={styles.scheduleBlock}
                              onClick={() => {
                                setMutError("");
                                setModal({ mode: "edit", item });
                              }}
                            >
                              <div className={styles.blockTitle}>{item.phancong?.monhoc?.tenmon}</div>
                              <div className={styles.blockSub}><strong>Tiết:</strong> {item.tietbatdau}-{item.tietketthuc}</div>
                              <div className={styles.blockSub}><strong>Lớp:</strong> {item.phancong?.lop?.tenlop}</div>
                              <div className={styles.blockSub}><strong>GV:</strong> {item.phancong?.giangvien?.hoten}</div>
                              <div className={styles.blockSub}><strong>Phòng:</strong> {item.phonghoc || "N/A"}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#EAD9CB", fontSize: 11, textAlign: "center", paddingTop: 16 }}>Trống</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile responsive Cards Grid */}
              <div className={styles.mobileCardsGrid}>
                {list.map((item) => (
                  <div key={item.malichhoc} className={styles.mobileCard}>
                    <div className={styles.mobileCardHeader}>
                      <span className="badge-purple" style={{ padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                        {getDayLabel(item.thutrongtuan)}
                      </span>
                      <span className={`${styles.badge} ${item.loaiphong === "Online" ? styles.typeOnline : item.loaiphong === "Thuchanh" ? styles.typePractice : styles.typeTheory}`}>
                        {getRoomTypeLabel(item.loaiphong)}
                      </span>
                    </div>

                    <div className={styles.mobileCardInfo}>
                      <div><strong>Môn học:</strong> {item.phancong?.monhoc?.tenmon}</div>
                      <div><strong>Tiết học:</strong> Tiết {item.tietbatdau} - {item.tietketthuc}</div>
                      <div><strong>Giảng viên:</strong> {item.phancong?.giangvien?.hoten}</div>
                      <div><strong>Lớp hành chính:</strong> {item.phancong?.lop?.tenlop}</div>
                      <div><strong>Phòng học:</strong> {item.phonghoc || "N/A"}</div>
                    </div>

                    <div className={styles.mobileCardFooter}>
                      <span style={{ fontSize: 12, color: "#8B6F5F" }}>Mã lịch: #{item.malichhoc}</span>
                      <div className={styles.actions}>
                        <button
                          className={`${styles.iconBtn} ${styles.editBtn}`}
                          onClick={() => {
                            setMutError("");
                            setModal({ mode: "edit", item });
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.deleteBtn}`}
                          onClick={() => {
                            setMutError("");
                            setModal({ mode: "delete", item });
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "40px" }}>
              <EmptyState message="Không tìm thấy lịch học nào phù hợp." />
            </div>
          )}

          {viewMode === "list" && total > 12 && (
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
          title={modal.mode === "create" ? "Xếp lịch học mới" : "Chỉnh sửa lịch học"}
          onClose={() => setModal(null)}
        >
          <ScheduleForm
            initial={modal.item}
            phancongs={phancongs}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal title="Xoá lịch học" onClose={() => setModal(null)} size="sm">
          <ConfirmDelete
            label={`Lịch học Thứ ${modal.item.thutrongtuan} Tiết ${modal.item.tietbatdau}-${modal.item.tietketthuc}`}
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

// ─── Main Schedules Page Wrapper with Suspense ──────────────────────────────
export default function AdminSchedulesPage() {
  return (
    <Suspense fallback={
      <DashboardShell pageTitle="Quản lý Lịch học">
        <div style={{ padding: "40px" }}>
          <TableSkeleton cols={5} rows={6} />
        </div>
      </DashboardShell>
    }>
      <AdminSchedulesContent />
    </Suspense>
  );
}
