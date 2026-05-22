"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import { ProfileDetailModal } from "@/components/admin/ProfileDetailModal";
import { AdminProfileModal } from "@/components/admin/AdminProfileModal";
import { ChangePasswordModal } from "@/components/dashboard/ChangePasswordModal";
import { useAdminStats, type AdminStats } from "@/hooks/admin/useAdminStats";
import { VaiTro, TrangThaiSinhVien, LoaiPhongHoc } from "@/types";

// ─── Local types ──────────────────────────────────────────────────────────────

interface AdminData extends AdminStats {
  todaySchedules?: {
    malichhoc: number;
    tietbatdau: number;
    tietketthuc: number;
    maphong: string | null;
    loaiphong: string | null;
    suchua: number | null;
    ghichu: string | null;
    monhoc: string;
    giangvien: string;
    lop: string;
    hocky: string;
  }[];
  auditLogs?: any[];
}

const STATUS_LABEL: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]: "Đang học",
  [TrangThaiSinhVien.Baoluu]: "Bảo lưu",
  [TrangThaiSinhVien.Thoi]: "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};

const SV_STATUS_BADGE: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]: "badge-green",
  [TrangThaiSinhVien.Baoluu]: "badge-yellow",
  [TrangThaiSinhVien.Thoi]: "badge-red",
  [TrangThaiSinhVien.Totnghiep]: "badge-blue",
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  gradient,
}: {
  label: string;
  value: number | string;
  gradient: string;
}) {
  return (
    <div
      className={`p-[24px_20px] flex flex-col-reverse gap-2 rounded-2xl border border-[#FFDBB6] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${gradient}`}
    >
      <span className="text-4xl font-extrabold text-[#2D1B14] leading-none">
        {value}
      </span>
      <span className="text-[11px] font-bold text-[#6B4F3F] uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const { getStats, searchStats, getDetail } = useAdminStats();
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"sv" | "gv">("sv");

  // Global Search State
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Detail View State
  const [selectedType, setSelectedType] = useState<"sv" | "gv" | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Profile, Notification & Logout Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Route guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.Admin)
      router.replace("/login");
  }, [user, loading, router]);

  // Load Initial Dashboard Stats, Schedules, Logs
  const loadDashboardData = async () => {
    setFetching(true);
    try {
      const stats = await getStats();
      setData(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Debounced Global Search
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const json = await searchStats(search);
        if (json.success) {
          setSearchResults(json.results);
          // Reload logs in background to show search activity log!
          loadLogsInBackground();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Load logs quietly in the background without refreshing full stats
  const loadLogsInBackground = async () => {
    try {
      const stats = await getStats();
      setData((prev) =>
        prev ? { ...prev, auditLogs: stats.auditLogs } : stats,
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch individual Student/Lecturer Details
  const handleViewDetail = async (type: "sv" | "gv", id: string) => {
    setSelectedType(type);
    setSelectedDetail(null);
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const json = await getDetail(type, id);
      if (json.success) {
        setSelectedDetail(json.data);
        // Reload logs to display detailed action on timeline
        loadLogsInBackground();
      } else {
        throw new Error(json.error || "Không thể tải chi tiết");
      }
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi.");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading || !user) return null;

  const handleLogoutConfirm = () => {
    logout();
    router.push("/login");
  };

  return (
    <DashboardShell pageTitle="Quản trị hệ thống">
      <div className="animate-fadeInUp flex flex-col gap-6">
        
        {/* Topbar: Greeting on left, Notifications + Profile Dropdown on right */}
        <div className="flex justify-between items-center mb-1 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2D1B14] m-0">
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className="text-xs text-[#8B6F5F] m-[4px_0_0_0]">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          {/* CỤM AVATAR NẰM NGANG HÀNG VỚI XIN CHÀO */}
          <div className="flex items-center gap-4 relative">
            
            {/* CỤM PROFILE AVATAR VÀ POPUP CHỨC NĂNG */}
            <div className="relative">
              <div 
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity p-1.5 hover:bg-[#FFF2EB]/60 rounded-xl border border-transparent hover:border-[#EAD9CB]"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                }}
              >
                <div className="w-[34px] h-[34px] rounded-full bg-[#FFF2EB] text-[#8B6F5F] flex items-center justify-center shrink-0 border border-[#EAD9CB] font-bold">
                  {user.hoten?.charAt(0) || "A"}
                </div>

                <div className="flex flex-col text-left max-sm:hidden">
                  <span className="text-[13px] font-bold text-[#2D1B14]">{user?.hoten || "—"}</span>
                  <span className="text-[10px] text-[#8B6F5F]">Quản trị viên</span>
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isProfileOpen && (
                <div className="absolute top-[48px] right-0 w-[220px] bg-white border border-[#EAD9CB] rounded-xl shadow-xl p-2 z-50 flex flex-col animate-scaleUp">
                  {/* Nút Thông tin cá nhân */}
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors font-semibold"
                    onClick={() => {
                      setIsAdminProfileOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    Thông tin cá nhân
                  </button>

                  {/* Nút Thay đổi mật khẩu */}
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#FAF6F2] rounded-lg transition-colors font-semibold"
                    onClick={() => {
                      setIsChangePasswordOpen(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    Thay đổi mật khẩu
                  </button>

                  <hr className="border-[#FAF6F2] my-1.5" />

                  {/* Nút Đăng xuất */}
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-red-500 font-bold hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => {
                      setShowLogoutConfirm(true);
                      setIsProfileOpen(false);
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Header with Integrated Professional Global Search */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-br from-[#FEFAE3] to-[#FFF0CD] p-5 rounded-2xl border border-[#FFDBB6] max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2D1B14] m-0 mb-1">
              Tổng quan hệ thống
            </h1>
            <p className="text-[13px] text-[#8B6F5F] m-0 font-medium capitalize">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex-1 min-w-[280px] max-w-[500px] max-sm:max-w-full">
            <div className="relative flex items-center">
              <svg
                className="absolute left-4 text-[#8B6F5F] pointer-events-none"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="w-full h-11 pl-11 pr-10 border-2 border-[#FFDBB6] rounded-full bg-white text-sm font-medium text-[#2D1B14] outline-none transition-all duration-200 shadow-[0_2px_8px_rgba(76,38,24,0.04)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.15)]"
                placeholder="Tìm sinh viên, lớp, môn, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-3 border-none bg-transparent text-[#8B6F5F] text-base cursor-pointer p-1 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#8B6F5F]/10 hover:text-[#2D1B14]"
                  onClick={() => setSearch("")}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <span className="badge badge-red">Quản trị viên</span>
        </div>

        {/* Global Search Results Drawer */}
        {search.trim() && (
          <div className="flex flex-col gap-4 bg-white border border-[#FFDBB6] rounded-2xl p-5 shadow-lg">
            {searchLoading ? (
              <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                Đang tìm kiếm thông tin trên hệ thống...
              </p>
            ) : !searchResults ||
              (!searchResults.sinhvien.length &&
                !searchResults.giangvien.length &&
                !searchResults.lop.length &&
                !searchResults.monhoc.length) ? (
              <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                Không tìm thấy kết quả phù hợp cho "{search}".
              </p>
            ) : (
              <>
                {/* Students Match */}
                {!!searchResults.sinhvien.length && (
                  <div>
                    <h3 className="text-sm font-bold text-[#2D1B14] m-0 mb-3 pb-1.5 border-b-2 border-[#FFDBB6] flex items-center gap-2">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Sinh viên ({searchResults.sinhvien.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-3">
                      {searchResults.sinhvien.map((sv: any) => (
                        <div
                          key={sv.masv}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FEFAE3] border border-[#FFDBB6] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-[#FFF0CD]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-[#2D1B14]">
                              {sv.hoten}
                            </span>
                            <span className="text-xs text-[#8B6F5F]">
                              MSSV: <code>{sv.masv}</code> • Lớp:{" "}
                              {sv.lop?.tenlop ?? "—"}
                            </span>
                          </div>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => handleViewDetail("sv", sv.masv)}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lecturers Match */}
                {!!searchResults.giangvien.length && (
                  <div style={{ marginTop: "12px" }}>
                    <h3 className="text-sm font-bold text-[#2D1B14] m-0 mb-3 pb-1.5 border-b-2 border-[#FFDBB6] flex items-center gap-2">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
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
                      Giảng viên ({searchResults.giangvien.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-3">
                      {searchResults.giangvien.map((gv: any) => (
                        <div
                          key={gv.magv}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FEFAE3] border border-[#FFDBB6] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-[#FFF0CD]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-[#2D1B14]">
                              {gv.hoten}
                            </span>
                            <span className="text-xs text-[#8B6F5F]">
                              Mã GV: <code>{gv.magv}</code> • Khoa:{" "}
                              {gv.khoa?.tenkhoa ?? "—"}
                            </span>
                          </div>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "12px", padding: "4px 10px" }}
                            onClick={() => handleViewDetail("gv", gv.magv)}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Classes Match */}
                {!!searchResults.lop.length && (
                  <div style={{ marginTop: "12px" }}>
                    <h3 className="text-sm font-bold text-[#2D1B14] m-0 mb-3 pb-1.5 border-b-2 border-[#FFDBB6] flex items-center gap-2">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      Lớp học ({searchResults.lop.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-3">
                      {searchResults.lop.map((lp: any) => (
                        <div
                          key={lp.malop}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FEFAE3] border border-[#FFDBB6] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-[#FFF0CD]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-[#2D1B14]">
                              {lp.tenlop}
                            </span>
                            <span className="text-xs text-[#8B6F5F]">
                              Mã lớp: <code>{lp.malop}</code> • Sĩ số: {lp.siso}{" "}
                              • Khoa: {lp.khoa?.tenkhoa ?? "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects Match */}
                {!!searchResults.monhoc.length && (
                  <div style={{ marginTop: "12px" }}>
                    <h3 className="text-sm font-bold text-[#2D1B14] m-0 mb-3 pb-1.5 border-b-2 border-[#FFDBB6] flex items-center gap-2">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z" />
                      </svg>
                      Môn học ({searchResults.monhoc.length})
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 mb-3">
                      {searchResults.monhoc.map((mh: any) => (
                        <div
                          key={mh.mamon}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FEFAE3] border border-[#FFDBB6] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:bg-[#FFF0CD]"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-[#2D1B14]">
                              {mh.tenmon}
                            </span>
                            <span className="text-xs text-[#8B6F5F]">
                              Mã môn: <code>{mh.mamon}</code> • Tín chỉ:{" "}
                              {mh.sotinchi} • Khoa: {mh.khoa?.tenkhoa ?? "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-3">
          <StatCard
            label="Tổng sinh viên"
            value={fetching ? "…" : (data?.totalSV ?? 0)}
            gradient="bg-gradient-to-br from-[#FBD9D9] to-white"
          />
          <StatCard
            label="Giảng viên"
            value={fetching ? "…" : (data?.totalGV ?? 0)}
            gradient="bg-gradient-to-br from-[#FFDBB6] to-white"
          />
          <StatCard
            label="Lớp học"
            value={fetching ? "…" : (data?.totalLop ?? 0)}
            gradient="bg-gradient-to-br from-[#FFF0CD] to-white"
          />
          <StatCard
            label="Khoa"
            value={fetching ? "…" : (data?.totalKhoa ?? 0)}
            gradient="bg-gradient-to-br from-[#FEFAE3] to-white"
          />
        </div>

        {/* Recent Lists (Tabs) */}
        <div
          className="flex gap-1 bg-[#FFF0CD] rounded-xl p-1 w-fit border border-[#FFDBB6] max-sm:w-full"
          role="tablist"
        >
          {(["sv", "gv"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`p-[10px_24px] border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-150 max-sm:flex-1 max-sm:text-center max-sm:p-[10px_12px] ${activeTab === tab ? "bg-primary text-white font-bold shadow-[0_2px_8px_rgba(194,84,80,0.25)]" : "bg-transparent text-[#6B4F3F] hover:bg-[#C25450]/8"}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "sv" ? "Sinh viên gần đây" : "Giảng viên gần đây"}
            </button>
          ))}
        </div>

        <section
          className="card"
          aria-label={
            activeTab === "sv" ? "Danh sách sinh viên" : "Danh sách giảng viên"
          }
        >
          {fetching ? (
            <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
              Đang tải…
            </p>
          ) : activeTab === "sv" ? (
            !data?.recentSV.length ? (
              <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                Chưa có sinh viên.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Lớp</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.recentSV.map((sv) => (
                      <tr key={sv.masv}>
                        <td>
                          <code style={{ fontSize: "12px" }}>{sv.masv}</code>
                        </td>
                        <td>
                          <strong style={{ color: "#2D1B14" }}>
                            {sv.hoten}
                          </strong>
                        </td>
                        <td>{sv.tenlop}</td>
                        <td>
                          <span
                            className={`badge ${SV_STATUS_BADGE[sv.trangthai] ?? "badge-peach"}`}
                          >
                            {STATUS_LABEL[sv.trangthai] ?? sv.trangthai}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ fontSize: "12px", padding: "4px 12px" }}
                            onClick={() => handleViewDetail("sv", sv.masv)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : !data?.recentGV.length ? (
            <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
              Chưa có giảng viên.
            </p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã GV</th>
                    <th>Họ tên</th>
                    <th>Khoa</th>
                    <th>Học vị</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.recentGV.map((gv) => (
                    <tr key={gv.magv}>
                      <td>
                        <code style={{ fontSize: "12px" }}>{gv.magv}</code>
                      </td>
                      <td>
                        <strong style={{ color: "#2D1B14" }}>{gv.hoten}</strong>
                      </td>
                      <td>{gv.tenkhoa}</td>
                      <td>
                        {gv.hocvi ? (
                          <span className="badge badge-blue">{gv.hocvi}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: "12px", padding: "4px 12px" }}
                          onClick={() => handleViewDetail("gv", gv.magv)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Schedules & Audit Logs Grid (Lịch học hôm nay & Nhật ký hệ thống) */}
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          {/* Column 1: Today's Class Schedule (Lịch học hôm nay - Giảng viên dạy gì) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 mb-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C25450"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <h2 className="text-lg font-bold text-[#2D1B14] m-0">
                  Lịch học hôm nay
                </h2>
                <p className="text-xs text-[#8B6F5F] m-0">
                  Danh sách giảng dạy và học tập trong ngày
                </p>
              </div>
            </div>

            <div className="card max-h-[480px] overflow-y-auto pr-1.5">
              {fetching ? (
                <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                  Đang tải lịch học…
                </p>
              ) : !data?.todaySchedules?.length ? (
                <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                  Hôm nay hệ thống không có lịch học nào.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.todaySchedules.map((schedule) => (
                    <div
                      key={schedule.malichhoc}
                      className="flex gap-4 p-4 bg-white border border-[#FFDBB6] rounded-xl transition-all duration-250 hover:translate-x-1 hover:border-primary hover:shadow-md"
                    >
                      <div className="flex flex-col items-center justify-center bg-[#FEFAE3] border border-[#FFDBB6] rounded-xl p-2 min-w-[68px] text-center">
                        <span className="text-[11px] font-bold text-[#6B4F3F] uppercase">
                          Tiết
                        </span>
                        <span className="text-base font-extrabold text-primary mt-0.5">
                          {schedule.tietbatdau}-{schedule.tietketthuc}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-[#2D1B14] mb-1">
                          {schedule.monhoc}
                        </h3>
                        <div className="text-xs font-medium text-[#6B4F3F] mb-1.5 flex items-center gap-1">
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
                          <span>
                            Dạy bởi: <strong>{schedule.giangvien}</strong>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="badge badge-peach">
                            Lớp: {schedule.lop}
                          </span>
                          <span className="badge badge-blue">
                            Phòng: {schedule.maphong || "N/A"}
                          </span>
                          {schedule.loaiphong && (
                            <span
                              className={`badge ${schedule.loaiphong === LoaiPhongHoc.Thuchanh ? "badge-yellow" : schedule.loaiphong === LoaiPhongHoc.Online ? "badge-red" : "badge-green"}`}
                            >
                              {schedule.loaiphong === LoaiPhongHoc.Lythuyet
                                ? "Lý thuyết"
                                : schedule.loaiphong === LoaiPhongHoc.Thuchanh
                                  ? "Thực hành"
                                  : "Trực tuyến"}
                            </span>
                          )}
                          <span
                            className="badge badge-peach"
                            style={{ opacity: 0.75, fontSize: "10px" }}
                          >
                            {schedule.hocky}
                          </span>
                        </div>
                        {schedule.ghichu && (
                          <p
                            style={{
                              margin: "6px 0 0 0",
                              fontSize: "11px",
                              color: "#8B6F5F",
                              fontStyle: "italic",
                            }}
                          >
                            * Ghi chú: {schedule.ghichu}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: System Logs (Nhật ký hệ thống) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 mb-1">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C25450"
                strokeWidth="2.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div>
                <h2 className="text-lg font-bold text-[#2D1B14] m-0">
                  Nhật ký hệ thống
                </h2>
                <p className="text-xs text-[#8B6F5F] m-0">
                  Giám sát lịch sử hoạt động thời gian thực
                </p>
              </div>
            </div>

            <div className="card max-h-[480px] overflow-y-auto pr-1.5">
              {fetching ? (
                <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                  Đang tải lịch sử nhật ký…
                </p>
              ) : !data?.auditLogs?.length ? (
                <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
                  Chưa có ghi chép lịch sử hoạt động nào.
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.auditLogs.map((log) => (
                    <div
                      key={log.manhatky}
                      className="flex items-start gap-3 p-3 bg-white border border-[#FFDBB6] rounded-xl text-[13px] transition-all duration-150 hover:bg-[#FEFAE3]"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-[#2D1B14] font-semibold m-0 mb-1 leading-normal">
                          {log.hanhdong}
                        </p>
                        <div className="flex justify-between items-center text-[11px] text-[#8B6F5F]">
                          <span className="font-medium text-[#6B4F3F]">
                            👤{" "}
                            {log.taikhoan
                              ? `${log.taikhoan.email} (${log.taikhoan.vaitro === "Admin" ? "Quản trị" : log.taikhoan.vaitro === "GiangVien" ? "Giảng viên" : "Sinh viên"})`
                              : log.mataikhoan}
                          </span>
                          <span>
                            🕒{" "}
                            {new Date(log.ngaytao).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            • <span className="font-mono">{log.diachiip}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Modal Window */}
      <ProfileDetailModal
        isOpen={showDetailModal}
        type={selectedType}
        detail={selectedDetail}
        loading={detailLoading}
        onClose={() => setShowDetailModal(false)}
      />

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isAdminProfileOpen}
        onClose={() => setIsAdminProfileOpen(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Custom Logout Confirmation Pop-up */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[99999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB] p-6 text-center animate-scaleUp">
            <h3 className="text-base font-bold text-[#2D1B14] mb-2 mt-2">Bạn có chắc chắn muốn đăng xuất?</h3>
            <p className="text-xs text-[#8B6F5F] mb-6">Phiên làm việc hiện tại của bạn trên thiết bị này sẽ được kết thúc.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-xs border border-[#EAD9CB] text-[#6B4F3F] hover:bg-[#FAF6F2] rounded-xl font-bold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-2.5 text-xs bg-[#C25450] hover:bg-[#A9433F] text-white font-bold rounded-xl shadow-md shadow-[#C25450]/20 hover:scale-95 transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
