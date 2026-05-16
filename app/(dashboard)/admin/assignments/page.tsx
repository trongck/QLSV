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
import { AssignmentForm } from "@/components/admin/AssignmentForms";




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
  const [filterStatus, setFilterStatus] = useState<"ongoing" | "ended" | "all">("ongoing");
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
        status: filterStatus,
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
    filterStatus,
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0">Quản lý Phân công Giảng dạy</h1>
            <p className="text-sm text-fg-subtle mt-1">
              Giao việc giảng dạy các lớp môn học, quản lý lớp học phần cho
              giảng viên
            </p>
          </div>
          <button
            className="btn-primary max-sm:w-full"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm phân công mới
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 px-5 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FBD9D9] text-primary">
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
              <div className="text-xl font-bold text-fg">{stats.totalAssignments}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Tổng lớp phân công</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 px-5 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FEFAE3] text-[#8A7A00] border border-[#EAD8A0]">
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
              <div className="text-xl font-bold text-fg">{stats.activeAssignments}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Đang hoạt động</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 px-5 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FFF0CD] text-[#B37D00]">
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
              <div className="text-xl font-bold text-fg">{stats.pendingSchedules}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Chưa xếp lịch học</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 px-5 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#E8F5E9] text-[#2E7D32]">
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
              <div className="text-xl font-bold text-fg">{stats.activeSemesters}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Học kỳ hiện hành</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Options */}
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center gap-3 p-4 px-5 bg-[#FFF0CD] border-b border-[#FFDBB6] rounded-t-2xl flex-wrap max-sm:flex-col max-sm:items-stretch">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm mã lớp học phần..."
            />

            <select
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] bg-white cursor-pointer outline-none text-fg transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] bg-white cursor-pointer outline-none text-fg transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] bg-white cursor-pointer outline-none text-fg transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] bg-white cursor-pointer outline-none text-fg transition-colors duration-200 focus:border-primary max-sm:w-full"
              value={filterNoSchedule}
              onChange={(e) => setFilterNoSchedule(e.target.value)}
            >
              <option value="all">-- Trạng thái xếp lịch --</option>
              <option value="no_schedule">Chưa xếp lịch học</option>
            </select>

            <select
              className="p-[10px_14px] border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] bg-white cursor-pointer outline-none text-fg transition-colors duration-200 focus:border-primary max-sm:w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">-- Tất cả hiệu lực --</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>

            {(search ||
              filterGv ||
              filterLop ||
              filterHk ||
              filterNoSchedule !== "all" ||
              filterStatus !== "ongoing") && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-lg text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
                onClick={() => {
                  setSearch("");
                  setFilterGv("");
                  setFilterLop("");
                  setFilterHk("");
                  setFilterNoSchedule("all");
                  setFilterStatus("ongoing");
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
              <div className="hidden md:block w-full overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã phân công</th>
                      <th>Giảng viên</th>
                      <th>Môn học</th>
                      <th>Lớp hành chính / Học phần</th>
                      <th>Học kỳ</th>
                      <th>Thời gian</th>
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
                            <div className="font-semibold">
                              {pc.giangvien?.hoten}
                            </div>
                            <span className="text-[11px] text-fg-subtle">
                              Mã GV: {pc.magv}
                            </span>
                          </td>
                          <td>
                            <div>{pc.monhoc?.tenmon}</div>
                            <span className="text-[11px] text-fg-subtle">
                              Mã môn: {pc.mamon}
                            </span>
                          </td>
                          <td>
                            <div>{pc.lop?.tenlop}</div>
                            <span
                              className="inline-block bg-[#F3E8FF] text-[#6B21A8] text-[11px] font-semibold px-1.5 py-0.5 rounded"
                            >
                              LHP: {pc.malophoc || "N/A"}
                            </span>
                          </td>
                          <td>
                            {pc.hocky?.tenhocky || `Học kỳ ${pc.mahocky}`}
                          </td>
                          <td>
                             <div className="text-[11px] whitespace-nowrap">
                               BD: {pc.ngaybatdau ? new Date(pc.ngaybatdau).toLocaleDateString("vi-VN") : "Học kỳ"}
                             </div>
                             <div className="text-[11px] whitespace-nowrap">
                               KT: {pc.ngayketthuc ? new Date(pc.ngayketthuc).toLocaleDateString("vi-VN") : "Học kỳ"}
                             </div>
                             {pc.ngayketthuc && new Date(pc.ngayketthuc) < new Date() && (
                               <span className="badge badge-red mt-1" style={{ fontSize: '9px', padding: '1px 4px' }}>Hết hạn</span>
                             )}
                           </td>
                          <td>
                            {hasSched ? (
                              <span className="badge badge-green">
                                Đã xếp lịch
                              </span>
                            ) : (
                              <span className="badge badge-red">
                                Chưa xếp lịch
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <button
                                className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-blue-600"
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
                                className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-[#E67E22]"
                                onClick={() =>
                                  router.push(
                                    `/admin/schedules?maphancong=${pc.maphancong}`,
                                  )
                                }
                                title="Cấu hình lịch học"
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
                                className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-red-600"
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
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {list.map((pc) => {
                  const hasSched = assignedPhanCongIds.has(pc.maphancong);
                  return (
                    <div key={pc.maphancong} className="bg-white border border-[#FFDBB6] rounded-xl p-4 flex flex-col gap-2.5">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-[15px] text-fg">
                          Phân công #{pc.maphancong}
                        </div>
                        {hasSched ? (
                          <span className="badge badge-green">
                            Đã xếp lịch
                          </span>
                        ) : (
                          <span className="badge badge-red">
                            Chưa xếp lịch
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-fg-muted flex flex-col gap-1">
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
                        <div>
                          <strong>Thời gian:</strong> {pc.ngaybatdau ? new Date(pc.ngaybatdau).toLocaleDateString("vi-VN") : "Học kỳ"} - {pc.ngayketthuc ? new Date(pc.ngayketthuc).toLocaleDateString("vi-VN") : "Học kỳ"}
                        </div>
                        {pc.ngayketthuc && new Date(pc.ngayketthuc) < new Date() && (
                          <div className="mt-1">
                            <span className="badge badge-red" style={{ fontSize: '10px' }}>Đã kết thúc</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t border-dashed border-[#FFF0CD] pt-2.5 mt-1">
                        <span style={{ fontSize: 12, color: "#8B6F5F" }}>
                          ID: {pc.maphancong}
                        </span>
                        <div className="flex gap-2">
                          <button
                            className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-blue-600"
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
                            className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-[#E67E22]"
                            onClick={() =>
                              router.push(
                                `/admin/schedules?maphancong=${pc.maphancong}`,
                              )
                            }
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
                            className="p-1.5 rounded-lg text-fg-subtle transition-all flex items-center justify-center hover:bg-[#FFF0CD] hover:text-red-600"
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
