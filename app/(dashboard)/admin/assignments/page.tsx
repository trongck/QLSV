"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import { usePhanCong, type PhanCongRow } from "@/hooks/admin/usePhancong";
import { useGiangVien, type GiangVienRow } from "@/hooks/admin/useGiangvien";
import { useMonhoc, type MonhocRow } from "@/hooks/admin/useMonhoc";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { useHocky, type HockyRow } from "@/hooks/admin/useHocky";
import { useLichHoc } from "@/hooks/admin/useLichhoc";
import { VaiTro } from "@/types";
import styles from "./assignment.module.css";

// ─── Assignment Form Component ───────────────────────────────────────────────
function AssignmentForm({
  initial,
  giangviens,
  monhocs,
  lops,
  hockys,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial?: Partial<PhanCongRow>;
  giangviens: GiangVienRow[];
  monhocs: MonhocRow[];
  lops: LopRow[];
  hockys: HockyRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    magv: initial?.magv ?? "",
    mamon: initial?.mamon ?? "",
    malop: initial?.malop ?? "",
    mahocky: initial?.mahocky ? String(initial.mahocky) : "",
    malophoc: initial?.malophoc ?? "",
    sisomax: initial?.sisomax ? String(initial.sisomax) : "",
    danghieuluc: initial?.danghieuluc ?? true,
  });

  const [localErr, setLocalErr] = useState("");

  // Auto-generate Section Code (Mã lớp học phần) based on Class and Subject
  useEffect(() => {
    if (!initial?.maphancong && form.mamon && form.malop && !form.malophoc) {
      setForm((prev) => ({
        ...prev,
        malophoc: `${prev.mamon.trim()}-${prev.malop.trim()}`,
      }));
    }
  }, [form.mamon, form.malop, form.malophoc, initial?.maphancong]);

  const handleValidateAndSubmit = () => {
    setLocalErr("");
    if (!form.magv) return setLocalErr("Vui lòng chọn giảng viên.");
    if (!form.mamon) return setLocalErr("Vui lòng chọn môn học.");
    if (!form.malop) return setLocalErr("Vui lòng chọn lớp hành chính.");
    if (!form.mahocky) return setLocalErr("Vui lòng chọn học kỳ.");

    if (form.sisomax) {
      const size = parseInt(form.sisomax);
      if (isNaN(size) || size <= 0) {
        return setLocalErr("Sĩ số tối đa phải là số nguyên dương.");
      }
    }

    onSubmit({
      ...form,
      mahocky: parseInt(form.mahocky),
      sisomax: form.sisomax ? parseInt(form.sisomax) : null,
    });
  };

  return (
    <>
      {(error || localErr) && (
        <div className="error-msg">{error || localErr}</div>
      )}
      <div className="form-grid">
        <div className="field">
          <label>Giảng viên phụ trách *</label>
          <select
            value={form.magv}
            onChange={(e) => setForm({ ...form, magv: e.target.value })}
          >
            <option value="">-- Chọn giảng viên --</option>
            {giangviens.map((gv) => (
              <option key={gv.magv} value={gv.magv}>
                {gv.hoten} ({gv.magv})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Học kỳ *</label>
          <select
            value={form.mahocky}
            onChange={(e) => setForm({ ...form, mahocky: e.target.value })}
          >
            <option value="">-- Chọn học kỳ --</option>
            {hockys.map((hk) => (
              <option key={hk.mahocky} value={hk.mahocky}>
                {hk.tenhocky} ({hk.namhoc})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Môn học *</label>
          <select
            value={form.mamon}
            onChange={(e) => setForm({ ...form, mamon: e.target.value })}
          >
            <option value="">-- Chọn môn học --</option>
            {monhocs.map((mh) => (
              <option key={mh.mamon} value={mh.mamon}>
                {mh.tenmon} ({mh.mamon})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Lớp hành chính *</label>
          <select
            value={form.malop}
            onChange={(e) => setForm({ ...form, malop: e.target.value })}
          >
            <option value="">-- Chọn lớp hành chính --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop} ({l.malop})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Mã lớp học phần (Tuỳ chọn)</label>
          <input
            value={form.malophoc}
            onChange={(e) => setForm({ ...form, malophoc: e.target.value })}
            placeholder="Ví dụ: INT1306-D21CN"
          />
          <span
            style={{
              fontSize: 11,
              color: "#8B6F5F",
              marginTop: 4,
              display: "block",
            }}
          >
            Tự động gợi ý dựa trên môn học và lớp học.
          </span>
        </div>

        <div className="field">
          <label>Sĩ số tối đa (Tuỳ chọn)</label>
          <input
            type="number"
            value={form.sisomax}
            onChange={(e) => setForm({ ...form, sisomax: e.target.value })}
            placeholder="Ví dụ: 80"
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
              checked={form.danghieuluc}
              onChange={(e) =>
                setForm({ ...form, danghieuluc: e.target.checked })
              }
            />
            Đang hoạt động / Hiệu lực giảng dạy
          </label>
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
          {loading
            ? "Đang xử lý..."
            : initial?.maphancong
              ? "Cập nhật"
              : "Tạo phân công"}
        </button>
      </div>
    </>
  );
}

// ─── Main Admin Assignments Page ─────────────────────────────────────────────
export default function AdminAssignmentsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getLop } = useLop();
  const { getHocky } = useHocky();
  const { getMonhoc } = useMonhoc();
  const { getGiangVien } = useGiangVien();
  const {
    getPhanCongPaginated,
    createPhanCong,
    updatePhanCong,
    deletePhanCong,
  } = usePhanCong();
  const { getLichHoc } = useLichHoc();
  const router = useRouter();

  // Primary data states
  const [list, setList] = useState<PhanCongRow[]>([]);
  const [giangviens, setGiangviens] = useState<GiangVienRow[]>([]);
  const [monhocs, setMonhocs] = useState<MonhocRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [hockys, setHockys] = useState<HockyRow[]>([]);

  // Schedules mapping for "No Schedule Assigned" detection
  const [assignedPhanCongIds, setAssignedPhanCongIds] = useState<Set<number>>(
    new Set(),
  );

  // Table filters & Pagination states
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterGv, setFilterGv] = useState("");
  const [filterMh, setFilterMh] = useState("");
  const [filterLop, setFilterLop] = useState("");
  const [filterHk, setFilterHk] = useState("");
  const [filterNoSchedule, setFilterNoSchedule] = useState("all"); // 'all' | 'no_schedule'
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Mutating states
  const [modal, setModal] = useState<{
    mode: "create" | "edit" | "delete";
    item?: PhanCongRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  // Loading lookups once authorized
  useEffect(() => {
    if (!authLoading && (!user || user.vaitro !== VaiTro.Admin)) {
      router.replace("/login");
    }

    if (user && user.vaitro === VaiTro.Admin) {
      // Load form lookups
      getGiangVien({ limit: 100 })
        .then((res) => setGiangviens(res.data))
        .catch(() => {});
      getMonhoc({ limit: 100 })
        .then((res) => setMonhocs(res.data))
        .catch(() => {});
      getLop({ limit: 100 })
        .then((res) => setLops(res.data))
        .catch(() => {});
      getHocky()
        .then((res) => setHockys(res.data))
        .catch(() => {});

      // Load all schedules to identify which phancong have schedules configured
      getLichHoc({ limit: 100 })
        .then((res) => {
          const ids = new Set(res.data.map((item) => item.maphancong));
          setAssignedPhanCongIds(ids);
        })
        .catch(() => {});
    }
  }, [user, authLoading, router]);

  // Main list fetch
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPhanCongPaginated({
        search,
        magv: filterGv,
        mamon: filterMh,
        malop: filterLop,
        mahocky: filterHk,
        page,
        limit: 10,
      });

      // Apply offline filter for "No Schedule" if selected
      let filteredData = res.data;
      if (filterNoSchedule === "no_schedule") {
        filteredData = res.data.filter(
          (pc) => !assignedPhanCongIds.has(pc.maphancong),
        );
      }

      setList(filteredData);
      setTotal(res.pagination.total);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    filterGv,
    filterMh,
    filterLop,
    filterHk,
    filterNoSchedule,
    page,
    assignedPhanCongIds,
  ]);

  useEffect(() => {
    if (user && user.vaitro === VaiTro.Admin) {
      loadData();
    }
  }, [user, loadData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalAssignments = list.length;
    const activeAssignments = list.filter((item) => item.danghieuluc).length;
    const pendingSchedules = list.filter(
      (item) => !assignedPhanCongIds.has(item.maphancong),
    ).length;
    const activeSemesters = hockys.filter((h) => h.danghieuluc).length;

    return {
      totalAssignments,
      activeAssignments,
      pendingSchedules,
      activeSemesters,
    };
  }, [list, assignedPhanCongIds, hockys]);

  if (authLoading || !user || user.vaitro !== VaiTro.Admin) return null;

  const handleSubmit = async (formData: any) => {
    setMutating(true);
    setMutError("");
    try {
      if (modal?.mode === "edit" && modal.item) {
        await updatePhanCong(modal.item.maphancong, formData);
      } else {
        await createPhanCong(formData);
      }
      setModal(null);

      const resSched = await getLichHoc({ limit: 100 });
      setAssignedPhanCongIds(
        new Set(resSched.data.map((item) => item.maphancong)),
      );
      loadData();
    } catch (e: any) {
      setMutError(e.message || "Lỗi lưu phân công giảng dạy.");
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async () => {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deletePhanCong(modal.item.maphancong);
      setModal(null);
      loadData();
    } catch (e: any) {
      setMutError(
        e.message ||
          "Không thể xoá phân công này. Hãy xoá lịch học đính kèm trước.",
      );
    } finally {
      setMutating(false);
    }
  };

  return (
    <DashboardShell pageTitle="Phân công Giảng dạy">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header Section */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Quản lý Phân công Giảng dạy</h1>
            <p className={styles.subtitle}>
              Giao việc giảng dạy các lớp môn học, quản lý lớp học phần cho
              giảng viên
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm phân công mới
          </button>
        </div>

        {/* Stats Section */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.stat1}`}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.totalAssignments}</div>
              <div className={styles.statLabel}>Tổng lớp phân công</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.stat2}`}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.activeAssignments}</div>
              <div className={styles.statLabel}>Đang hoạt động</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.stat3}`}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.pendingSchedules}</div>
              <div className={styles.statLabel}>Chưa xếp lịch học</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.stat4}`}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <div className={styles.statValue}>{stats.activeSemesters}</div>
              <div className={styles.statLabel}>Học kỳ hiện hành</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Options */}
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm mã lớp học phần..."
            />

            <select
              className={styles.filterSelect}
              value={filterGv}
              onChange={(e) => setFilterGv(e.target.value)}
            >
              <option value="">-- Tất cả giảng viên --</option>
              {giangviens.map((gv) => (
                <option key={gv.magv} value={gv.magv}>
                  {gv.hoten}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filterLop}
              onChange={(e) => setFilterLop(e.target.value)}
            >
              <option value="">-- Tất cả lớp hành chính --</option>
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

            <select
              className={styles.filterSelect}
              value={filterNoSchedule}
              onChange={(e) => setFilterNoSchedule(e.target.value)}
            >
              <option value="all">-- Trạng thái xếp lịch --</option>
              <option value="no_schedule">Chưa xếp lịch học</option>
            </select>

            {(search ||
              filterGv ||
              filterLop ||
              filterHk ||
              filterNoSchedule !== "all") && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterGv("");
                  setFilterLop("");
                  setFilterHk("");
                  setFilterNoSchedule("all");
                  setPage(1);
                }}
              >
                ✕ Xoá bộ lọc
              </button>
            )}
          </div>

          {/* Main List Rendering */}
          {isLoading ? (
            <div style={{ padding: "40px" }}>
              <TableSkeleton cols={6} rows={5} />
            </div>
          ) : list.length > 0 ? (
            <>
              {/* Desktop / Tablet Grid Table */}
              <div className={styles.tableContainer}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Mã phân công</th>
                      <th>Giảng viên</th>
                      <th>Môn học</th>
                      <th>Lớp hành chính / Học phần</th>
                      <th>Học kỳ</th>
                      <th>Trạng thái lịch</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((pc) => {
                      const hasSched = assignedPhanCongIds.has(pc.maphancong);
                      return (
                        <tr key={pc.maphancong}>
                          <td>
                            <strong>#{pc.maphancong}</strong>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {pc.giangvien?.hoten}
                            </div>
                            <span style={{ fontSize: 11, color: "#8B6F5F" }}>
                              Mã GV: {pc.magv}
                            </span>
                          </td>
                          <td>
                            <div>{pc.monhoc?.tenmon}</div>
                            <span style={{ fontSize: 11, color: "#8B6F5F" }}>
                              Mã môn: {pc.mamon}
                            </span>
                          </td>
                          <td>
                            <div>{pc.lop?.tenlop}</div>
                            <span
                              className="badge-purple"
                              style={{
                                fontSize: 11,
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              LHP: {pc.malophoc || "N/A"}
                            </span>
                          </td>
                          <td>
                            {pc.hocky?.tenhocky || `Học kỳ ${pc.mahocky}`}
                          </td>
                          <td>
                            {hasSched ? (
                              <span
                                className={`${styles.badge} ${styles.activeBadge}`}
                              >
                                Đã xếp lịch
                              </span>
                            ) : (
                              <span
                                className={`${styles.badge} ${styles.inactiveBadge}`}
                              >
                                Chưa xếp lịch
                              </span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className={`${styles.iconBtn} ${styles.editBtn}`}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: pc });
                                }}
                                title="Sửa phân công"
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

                              {/* Direct shortcut to schedules page with filter for this maphancong */}
                              <button
                                className={styles.iconBtn}
                                onClick={() =>
                                  router.push(
                                    `/admin/schedules?maphancong=${pc.maphancong}`,
                                  )
                                }
                                title="Cấu hình lịch học"
                                style={{ color: "#E67E22" }}
                              >
                                <svg
                                  width="18"
                                  height="18"
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
                              </button>

                              <button
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: pc });
                                }}
                                title="Xoá phân công"
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
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile responsive Cards Grid */}
              <div className={styles.mobileCardsGrid}>
                {list.map((pc) => {
                  const hasSched = assignedPhanCongIds.has(pc.maphancong);
                  return (
                    <div key={pc.maphancong} className={styles.mobileCard}>
                      <div className={styles.mobileCardHeader}>
                        <div className={styles.mobileCardTitle}>
                          Phân công #{pc.maphancong}
                        </div>
                        {hasSched ? (
                          <span
                            className={`${styles.badge} ${styles.activeBadge}`}
                          >
                            Đã xếp lịch
                          </span>
                        ) : (
                          <span
                            className={`${styles.badge} ${styles.inactiveBadge}`}
                          >
                            Chưa xếp lịch
                          </span>
                        )}
                      </div>

                      <div className={styles.mobileCardInfo}>
                        <div>
                          <strong>Giảng viên:</strong> {pc.giangvien?.hoten} (
                          {pc.magv})
                        </div>
                        <div>
                          <strong>Môn học:</strong> {pc.monhoc?.tenmon}
                        </div>
                        <div>
                          <strong>Lớp hành chính:</strong> {pc.lop?.tenlop}
                        </div>
                        <div>
                          <strong>Mã lớp học phần:</strong>{" "}
                          {pc.malophoc || "N/A"}
                        </div>
                        <div>
                          <strong>Học kỳ:</strong> {pc.hocky?.tenhocky}
                        </div>
                      </div>

                      <div className={styles.mobileCardFooter}>
                        <span style={{ fontSize: 12, color: "#8B6F5F" }}>
                          ID: {pc.maphancong}
                        </span>
                        <div className={styles.actions}>
                          <button
                            className={`${styles.iconBtn} ${styles.editBtn}`}
                            onClick={() => {
                              setMutError("");
                              setModal({ mode: "edit", item: pc });
                            }}
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
                            className={styles.iconBtn}
                            onClick={() =>
                              router.push(
                                `/admin/schedules?maphancong=${pc.maphancong}`,
                              )
                            }
                            style={{ color: "#E67E22" }}
                          >
                            <svg
                              width="18"
                              height="18"
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
                          </button>

                          <button
                            className={`${styles.iconBtn} ${styles.deleteBtn}`}
                            onClick={() => {
                              setMutError("");
                              setModal({ mode: "delete", item: pc });
                            }}
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
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: "40px" }}>
              <EmptyState message="Không tìm thấy bản ghi phân công nào phù hợp." />
            </div>
          )}

          {total > 10 && (
            <div style={{ padding: "20px", borderTop: "1px solid #FFDBB6" }}>
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
            modal.mode === "create"
              ? "Thêm phân công mới"
              : "Sửa phân công giảng dạy"
          }
          onClose={() => setModal(null)}
        >
          <AssignmentForm
            initial={modal.item}
            giangviens={giangviens}
            monhocs={monhocs}
            lops={lops}
            hockys={hockys}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá phân công"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={`Phân công #${modal.item.maphancong} - GV ${modal.item.giangvien?.hoten}`}
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
