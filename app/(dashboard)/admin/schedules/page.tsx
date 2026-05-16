"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useLichHoc, type LichHocRow } from "@/hooks/admin/useLichhoc";
import { usePhanCong, type PhanCongRow } from "@/hooks/admin/usePhancong";
import { useHocky, type HockyRow } from "@/hooks/admin/useHocky";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { usePhongHoc, type PhongHocRow } from "@/hooks/admin/usePhonghoc";
import { VaiTro, LoaiPhongHoc } from "@/types";
import {
  ScheduleForm,
  getDayLabel,
  getRoomTypeLabel,
} from "@/components/admin/ScheduleForm";




// ─── Inner Component to safely read Search Params ─────────────────────────────
function AdminSchedulesContent() {
  const { user, loading: authLoading } = useAuth();
  const { getLop } = useLop();
  const { getHocky } = useHocky();
  const { getPhanCong } = usePhanCong();
  const { getPhongHoc } = usePhongHoc();
  const { getLichHoc, createLichHoc, updateLichHoc, deleteLichHoc } =
    useLichHoc();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary data states
  const [list, setList] = useState<LichHocRow[]>([]);
  const [phancongs, setPhancongs] = useState<PhanCongRow[]>([]);
  const [lops, setLops] = useState<LopRow[]>([]);
  const [hockys, setHockys] = useState<HockyRow[]>([]);
  const [phonghocs, setPhonghocs] = useState<PhongHocRow[]>([]);

  // UI representation mode: 'list' (Traditional table) | 'calendar' (Visual calendar grid)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Filter & Pagination states
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterPc, setFilterPc] = useState(
    searchParams.get("maphancong") ?? "",
  );
  const [filterThu, setFilterThu] = useState("");
  const [filterLop, setFilterLop] = useState("");
  const [filterHk, setFilterHk] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ongoing" | "ended" | "all">("ongoing");
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
      // Load danh sách phòng học
      getPhongHoc()
        .then((data) => setPhonghocs(data))
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
        maphong: filterRoom,
        status: filterStatus,
        page: viewMode === "list" ? page : undefined,
        limit: viewMode === "list" ? 12 : 200,
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
  }, [filterPc, filterThu, filterLop, filterHk, filterRoom, filterStatus, page, viewMode]);

  useEffect(() => {
    if (user && user.vaitro === VaiTro.Admin) {
      loadData();
    }
  }, [user, loadData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalSchedules = list.length;
    const theoryRooms = list.filter(
      (item) => item.phonghoc?.loaiphong === LoaiPhongHoc.Lythuyet,
    ).length;
    const practiceRooms = list.filter(
      (item) => item.phonghoc?.loaiphong === LoaiPhongHoc.Thuchanh,
    ).length;
    const onlineRooms = list.filter(
      (item) => item.phonghoc?.loaiphong === LoaiPhongHoc.Online,
    ).length;
    return { totalSchedules, theoryRooms, practiceRooms, onlineRooms };
  }, [list]);

  // Calendar rendering configuration (Monday (2) to Sunday (8))
  const weekdays = [2, 3, 4, 5, 6, 7, 8];

  // Map schedules by weekdays for Visual Scheduler rendering
  const weekdaySchedules = useMemo(() => {
    const map: Record<number, LichHocRow[]> = {
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 max-sm:flex-col max-sm:items-stretch">
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" />
                  <polyline points="12 19 5 12 12 5" strokeWidth="2.5" />
                </svg>
                Quay lại danh sách Phân công
              </button>
            )}
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Lịch học & Thời khóa biểu</h1>
            <p className="text-xs text-fg-subtle mt-1">
              Xếp lịch học, sắp xếp phòng học, tiết học và theo dõi thời khoá
              biểu toàn trường
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* View Mode Toggle Switch */}
            <div className="flex bg-[#FFF0CD] p-1 rounded-xl border border-[#FFDBB6] max-sm:hidden">
              <button
                className={`px-4 py-2 border-none bg-transparent rounded-lg text-xs font-semibold text-fg-subtle cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-fg shadow-[0_2px_4px_rgba(139,111,95,0.08)]" : ""}`}
                onClick={() => {
                  setViewMode("list");
                  setPage(1);
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
                className={`px-4 py-2 border-none bg-transparent rounded-lg text-xs font-semibold text-fg-subtle cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${viewMode === "calendar" ? "bg-white text-fg shadow-[0_2px_4px_rgba(139,111,95,0.08)]" : ""}`}
                onClick={() => setViewMode("calendar")}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FFDBB6] text-orange-700">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-fg">{stats.totalSchedules}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Lịch xếp tuần này</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FBD9D9] text-[#C25450]">
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
              <div className="text-xl font-bold text-fg">{stats.theoryRooms}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Lớp lý thuyết</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FFF0CD] text-[#B37D00]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-fg">{stats.practiceRooms}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Lớp thực hành</div>
            </div>
          </div>

          <div className="bg-white border border-[#FFDBB6] rounded-2xl p-4 flex items-center gap-4 shadow-[0_2px_4px_rgba(139,111,95,0.04)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[0_6px_12px_rgba(139,111,95,0.08)]">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FEFAE3] text-[#8A7A00] border border-[#EAD8A0]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 7a2 2 0 0 0-2.45-1.45L11 8 1 5v4l10 3 12-3z" />
                <path d="M23 11a2 2 0 0 0-2.45-1.45L11 12 1 9v4l10 3 12-3z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-fg">{stats.onlineRooms}</div>
              <div className="text-xs text-fg-subtle mt-0.5">Phòng học trực tuyến</div>
            </div>
          </div>
        </div>

        {/* Toolbar Filter Controls */}
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch bg-[#FFF0CD] rounded-t-2xl">
            <SearchBar
              value={filterRoom}
              onChange={setFilterRoom}
              placeholder="Tìm theo phòng học..."
            />

            <select
              className="p-[10px_14px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
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
              className="p-[10px_14px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary max-sm:w-full"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">-- Tất cả hiệu lực --</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>

            {(filterRoom || filterPc || filterThu || filterLop || filterHk || filterStatus !== "ongoing") && (
              <button
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
                onClick={() => {
                  setFilterRoom("");
                  setFilterPc("");
                  setFilterThu("");
                  setFilterLop("");
                  setFilterHk("");
                  setFilterStatus("ongoing");
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
                <div className="w-full overflow-x-auto max-sm:hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">ID</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Ngày học</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Tiết học</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Môn học / Lớp</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Giảng viên</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Phòng học</th>
                        <th className="bg-[#FFF0CD] text-[#5D4037] font-semibold text-[13px] p-[14px_18px] border-b-[1.5px] border-[#FFDBB6] whitespace-nowrap">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((item) => (
                        <tr key={item.malichhoc} className="hover:bg-[#FEFAE3]">
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <strong>#{item.malichhoc}</strong>
                          </td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <span
                              className="badge-purple"
                              style={{ padding: "4px 8px", borderRadius: 6 }}
                            >
                              {getDayLabel(item.thutrongtuan)}
                            </span>
                          </td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <strong>
                              Tiết {item.tietbatdau} - {item.tietketthuc}
                            </strong>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#8B6F5F",
                                marginTop: 2,
                              }}
                            >
                              ({item.tietketthuc - item.tietbatdau + 1} tiết)
                            </div>
                          </td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <div style={{ fontWeight: 600 }}>
                              {item.phancong?.monhoc?.tenmon}
                            </div>
                            <span style={{ fontSize: 11, color: "#8B6F5F" }}>
                              Lớp: {item.phancong?.lop?.tenlop} | LHP:{" "}
                              {item.phancong?.malophoc || "N/A"}
                            </span>
                          </td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">{item.phancong?.giangvien?.hoten}</td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <span
                              className={`inline-block text-[11px] font-bold p-[3px_8px] rounded-lg ${
                            item.phonghoc?.loaiphong === LoaiPhongHoc.Online
                              ? "bg-[#F3E5F5] text-[#8E24AA]"
                              : item.phonghoc?.loaiphong === LoaiPhongHoc.Thuchanh
                                ? "bg-[#E8F5E9] text-[#2E7D32]"
                                : "bg-[#E3F2FD] text-[#1976D2]"
                              }`}
                            >
                              {item.maphong || "Chưa xếp phòng"} (
                              {getRoomTypeLabel(item.phonghoc?.loaiphong)})
                            </span>
                          </td>
                          <td className="p-[14px_18px] text-sm text-fg border-b border-[#FFF0CD] transition-colors duration-150">
                            <div className="flex gap-2">
                              <button
                                className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 flex items-center justify-center hover:bg-[#FFF0CD] hover:text-blue-600"
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item });
                                }}
                                title="Sửa lịch học"
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
                                className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 flex items-center justify-center hover:bg-[#FFF0CD] hover:text-red-600"
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item });
                                }}
                                title="Xoá lịch học"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VIEW 2: Premium Visual Weekly Timetable Grid View */}
              {viewMode === "calendar" && (
                <div className="p-5 overflow-x-auto max-sm:hidden">
                  <div className="min-w-[800px] grid grid-cols-[80px_repeat(7,1fr)] border border-[#FFDBB6] rounded-xl overflow-hidden bg-white">
                    <div className="bg-[#FFF0CD] text-[#5D4037] font-bold text-[13px] p-3 text-center border-b-2 border-r border-[#FFDBB6]">Thời gian</div>
                    {weekdays.map((thu) => (
                      <div key={thu} className="bg-[#FFF0CD] text-[#5D4037] font-bold text-[13px] p-3 text-center border-b-2 border-r border-[#FFDBB6] last:border-r-0">
                        {getDayLabel(thu)}
                      </div>
                    ))}

                    {/* Simple rendering grouping schedule list per day column */}
                    <div className="bg-[#FEFAE3] text-fg-subtle text-[11px] font-semibold flex items-center justify-center border-b border-r-2 border-[#FFDBB6] p-[14px_4px]">Cả ngày</div>
                    {weekdays.map((thu) => (
                      <div key={thu} className="relative border-b border-[#FFF0CD] border-r border-[#FFDBB6] min-h-[52px] last:border-r-0">
                        {weekdaySchedules[thu].length > 0 ? (
                          weekdaySchedules[thu].map((item) => (
                            <div
                              key={item.malichhoc}
                              className="bg-[#FFF0CD] border-l-4 border-[#FFDBB6] rounded-lg p-1.5 m-1 shadow-[0_2px_4px_rgba(139,111,95,0.06)] cursor-pointer transition-all duration-200 flex flex-col gap-0.5 hover:scale-102 hover:shadow-[0_4px_8px_rgba(139,111,95,0.12)] hover:bg-[#FFDBB6] hover:border-l-primary"
                              onClick={() => {
                                setMutError("");
                                setModal({ mode: "edit", item });
                              }}
                            >
                              <div className="text-[11px] font-bold text-fg whitespace-nowrap overflow-hidden text-ellipsis">
                                {item.phancong?.monhoc?.tenmon}
                              </div>
                              <div className="text-[9px] text-fg-subtle">
                                <strong>Tiết:</strong> {item.tietbatdau}-
                                {item.tietketthuc}
                              </div>
                              <div className="text-[9px] text-fg-subtle">
                                <strong>Lớp:</strong>{" "}
                                {item.phancong?.lop?.tenlop}
                              </div>
                              <div className="text-[9px] text-fg-subtle">
                                <strong>GV:</strong>{" "}
                                {item.phancong?.giangvien?.hoten}
                              </div>
                              <div className="text-[9px] text-fg-subtle">
                                <strong>Phòng:</strong> {item.maphong || "N/A"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            style={{
                              color: "#EAD9CB",
                              fontSize: 11,
                              textAlign: "center",
                              paddingTop: 16,
                            }}
                          >
                            Trống
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile responsive Cards Grid */}
              <div className="hidden max-sm:flex flex-col gap-3 p-4">
                {list.map((item) => (
                  <div key={item.malichhoc} className="bg-white border border-[#FFDBB6] rounded-xl p-4 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start">
                      <span
                        className="badge-purple"
                        style={{
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        {getDayLabel(item.thutrongtuan)}
                      </span>
                      <span
                        className={`inline-block text-[11px] font-bold p-[3px_8px] rounded-lg ${
                          item.phonghoc?.loaiphong === LoaiPhongHoc.Online
                            ? "bg-[#F3E5F5] text-[#8E24AA]"
                            : item.phonghoc?.loaiphong === LoaiPhongHoc.Thuchanh
                              ? "bg-[#E8F5E9] text-[#2E7D32]"
                              : "bg-[#E3F2FD] text-[#1976D2]"
                        }`}
                      >
                        {getRoomTypeLabel(item.phonghoc?.loaiphong)}
                      </span>
                    </div>

                    <div className="text-sm text-[#5D4037] flex flex-col gap-1">
                      <div>
                        <strong>Môn học:</strong>{" "}
                        {item.phancong?.monhoc?.tenmon}
                      </div>
                      <div>
                        <strong>Tiết học:</strong> Tiết {item.tietbatdau} -{" "}
                        {item.tietketthuc}
                      </div>
                      <div>
                        <strong>Giảng viên:</strong>{" "}
                        {item.phancong?.giangvien?.hoten}
                      </div>
                      <div>
                        <strong>Lớp hành chính:</strong>{" "}
                        {item.phancong?.lop?.tenlop}
                      </div>
                      <div>
                        <strong>Phòng học:</strong> {item.maphong || "N/A"}{" "}
                        {item.phonghoc
                          ? `(${getRoomTypeLabel(item.phonghoc.loaiphong)})`
                          : ""}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-[#FFF0CD] pt-2.5 mt-1">
                      <span style={{ fontSize: 12, color: "#8B6F5F" }}>
                        Mã lịch: #{item.malichhoc}
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 flex items-center justify-center hover:bg-[#FFF0CD] hover:text-blue-600"
                          onClick={() => {
                            setMutError("");
                            setModal({ mode: "edit", item });
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
                          className="bg-none border-none p-1.5 rounded-lg cursor-pointer text-fg-subtle transition-all duration-200 flex items-center justify-center hover:bg-[#FFF0CD] hover:text-red-600"
                          onClick={() => {
                            setMutError("");
                            setModal({ mode: "delete", item });
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
          title={
            modal.mode === "create" ? "Xếp lịch học mới" : "Chỉnh sửa lịch học"
          }
          onClose={() => setModal(null)}
        >
          <ScheduleForm
            initial={modal.item}
            phancongs={phancongs}
            phonghocs={phonghocs}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}

      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá lịch học"
          onClose={() => setModal(null)}
          size="sm"
        >
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
    <Suspense
      fallback={
        <DashboardShell pageTitle="Quản lý Lịch học">
          <div style={{ padding: "40px" }}>
            <TableSkeleton cols={5} rows={6} />
          </div>
        </DashboardShell>
      }
    >
      <AdminSchedulesContent />
    </Suspense>
  );
}
