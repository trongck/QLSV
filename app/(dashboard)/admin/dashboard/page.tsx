"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import { apiFetch } from "@/services/auth.service";
import { VaiTro, TrangThaiSinhVien } from "@/types";
import type { AdminStats } from "@/app/api/admin/stats/route";
import styles from "./admin-dashboard.module.css";

// ─── Local types ──────────────────────────────────────────────────────────────

interface AdminData extends AdminStats {
  todaySchedules?: {
    malichhoc: number;
    tietbatdau: number;
    tietketthuc: number;
    phonghoc: string | null;
    loaiphong: string | null;
    ghichu: string | null;
    monhoc: string;
    giangvien: string;
    lop: string;
  }[];
  auditLogs?: any[];
}

const STATUS_LABEL: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]:   "Đang học",
  [TrangThaiSinhVien.Baoluu]:    "Bảo lưu",
  [TrangThaiSinhVien.Thoi]:      "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};

const SV_STATUS_BADGE: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]:   "badge-green",
  [TrangThaiSinhVien.Baoluu]:    "badge-yellow",
  [TrangThaiSinhVien.Thoi]:      "badge-red",
  [TrangThaiSinhVien.Totnghiep]: "badge-blue",
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData]         = useState<AdminData | null>(null);
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

  // Route guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.Admin) router.replace("/login");
  }, [user, loading, router]);

  // Load Initial Dashboard Stats, Schedules, Logs
  const loadDashboardData = async () => {
    setFetching(true);
    try {
      const res = await apiFetch("/api/admin/stats");
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        const msg = ct.includes("application/json")
          ? ((await res.json().catch(() => ({}))) as { error?: string }).error
          : undefined;
        throw new Error(msg ?? `Không thể tải dữ liệu thống kê (${res.status}).`);
      }
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server trả về dữ liệu không hợp lệ.");
      const json: AdminStats = await res.json();
      setData(json);
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
        const res = await apiFetch(`/api/admin/stats?search=${encodeURIComponent(search)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setSearchResults(json.results);
            // Reload logs in background to show search activity log!
            loadLogsInBackground();
          }
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
      const res = await apiFetch("/api/admin/stats");
      if (res.ok) {
        const json = await res.json();
        setData((prev) => prev ? { ...prev, auditLogs: json.auditLogs } : json);
      }
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
      const res = await apiFetch(`/api/admin/stats?detailType=${type}&detailId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSelectedDetail(json.data);
          // Reload logs to display detailed action on timeline
          loadLogsInBackground();
        } else {
          throw new Error(json.error || "Không thể tải chi tiết");
        }
      } else {
        throw new Error("Lỗi tải chi tiết");
      }
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi.");
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading || !user) return null;

  return (
    <DashboardShell pageTitle="Quản trị hệ thống">
      <div className={`animate-fadeInUp ${styles.page}`}>
        
        {/* Header with Integrated Professional Global Search */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Tổng quan hệ thống</h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
              })}
            </p>
          </div>
          
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Tìm sinh viên, lớp, môn, giảng viên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearchBtn} onClick={() => setSearch("")} title="Xóa tìm kiếm">
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <span className="badge badge-red">Quản trị viên</span>
        </div>

        {/* Global Search Results Drawer */}
        {search.trim() && (
          <div className={styles.searchResultsArea}>
            {searchLoading ? (
              <p className={styles.emptyText}>Đang tìm kiếm thông tin trên hệ thống...</p>
            ) : !searchResults || (
              !searchResults.sinhvien.length &&
              !searchResults.giangvien.length &&
              !searchResults.lop.length &&
              !searchResults.monhoc.length
            ) ? (
              <p className={styles.emptyText}>Không tìm thấy kết quả phù hợp cho "{search}".</p>
            ) : (
              <>
                {/* Students Match */}
                {!!searchResults.sinhvien.length && (
                  <div>
                    <h3 className={styles.searchSectionTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Sinh viên ({searchResults.sinhvien.length})
                    </h3>
                    <div className={styles.searchGrid}>
                      {searchResults.sinhvien.map((sv: any) => (
                        <div key={sv.masv} className={styles.searchResultItem}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{sv.hoten}</span>
                            <span className={styles.itemMeta}>MSSV: <code>{sv.masv}</code> • Lớp: {sv.lop?.tenlop ?? "—"}</span>
                          </div>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => handleViewDetail("sv", sv.masv)}>
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
                    <h3 className={styles.searchSectionTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Giảng viên ({searchResults.giangvien.length})
                    </h3>
                    <div className={styles.searchGrid}>
                      {searchResults.giangvien.map((gv: any) => (
                        <div key={gv.magv} className={styles.searchResultItem}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{gv.hoten}</span>
                            <span className={styles.itemMeta}>Mã GV: <code>{gv.magv}</code> • Khoa: {gv.khoa?.tenkhoa ?? "—"}</span>
                          </div>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => handleViewDetail("gv", gv.magv)}>
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
                    <h3 className={styles.searchSectionTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      Lớp học ({searchResults.lop.length})
                    </h3>
                    <div className={styles.searchGrid}>
                      {searchResults.lop.map((lp: any) => (
                        <div key={lp.malop} className={styles.searchResultItem}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{lp.tenlop}</span>
                            <span className={styles.itemMeta}>Mã lớp: <code>{lp.malop}</code> • Sĩ số: {lp.siso} • Khoa: {lp.khoa?.tenkhoa ?? "—"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects Match */}
                {!!searchResults.monhoc.length && (
                  <div style={{ marginTop: "12px" }}>
                    <h3 className={styles.searchSectionTitle}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z" />
                      </svg>
                      Môn học ({searchResults.monhoc.length})
                    </h3>
                    <div className={styles.searchGrid}>
                      {searchResults.monhoc.map((mh: any) => (
                        <div key={mh.mamon} className={styles.searchResultItem}>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{mh.tenmon}</span>
                            <span className={styles.itemMeta}>Mã môn: <code>{mh.mamon}</code> • Tín chỉ: {mh.sotinchi} • Khoa: {mh.khoa?.tenkhoa ?? "—"}</span>
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
        <div className={styles.statsGrid}>
          <StatCard label="Tổng sinh viên" value={fetching ? "…" : data?.totalSV   ?? 0} />
          <StatCard label="Giảng viên"     value={fetching ? "…" : data?.totalGV   ?? 0} />
          <StatCard label="Lớp học"        value={fetching ? "…" : data?.totalLop  ?? 0} />
          <StatCard label="Khoa"           value={fetching ? "…" : data?.totalKhoa ?? 0} />
        </div>

        {/* Recent Lists (Tabs) */}
        <div className={styles.tabBar} role="tablist">
          {(["sv", "gv"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "sv" ? "Sinh viên gần đây" : "Giảng viên gần đây"}
            </button>
          ))}
        </div>

        <section
          className="card"
          aria-label={activeTab === "sv" ? "Danh sách sinh viên" : "Danh sách giảng viên"}
        >
          {fetching ? (
            <p className={styles.emptyText}>Đang tải…</p>
          ) : activeTab === "sv" ? (
            !data?.recentSV.length ? (
              <p className={styles.emptyText}>Chưa có sinh viên.</p>
            ) : (
              <div className={styles.tableWrap}>
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
                        <td><code style={{ fontSize: "12px" }}>{sv.masv}</code></td>
                        <td><strong style={{ color: "#2D1B14" }}>{sv.hoten}</strong></td>
                        <td>{sv.tenlop}</td>
                        <td>
                          <span className={`badge ${SV_STATUS_BADGE[sv.trangthai] ?? "badge-peach"}`}>
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
          ) : (
            !data?.recentGV.length ? (
              <p className={styles.emptyText}>Chưa có giảng viên.</p>
            ) : (
              <div className={styles.tableWrap}>
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
                        <td><code style={{ fontSize: "12px" }}>{gv.magv}</code></td>
                        <td><strong style={{ color: "#2D1B14" }}>{gv.hoten}</strong></td>
                        <td>{gv.tenkhoa}</td>
                        <td>
                          {gv.hocvi
                            ? <span className="badge badge-blue">{gv.hocvi}</span>
                            : "—"}
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
            )
          )}
        </section>

        {/* Schedules & Audit Logs Grid (Lịch học hôm nay & Nhật ký hệ thống) */}
        <div className={styles.dashboardGrid}>
          
          {/* Column 1: Today's Class Schedule (Lịch học hôm nay - Giảng viên dạy gì) */}
          <div className={styles.gridCol}>
            <div className={styles.colHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C25450" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <div>
                <h2 className={styles.colTitle}>Lịch học hôm nay</h2>
                <p className={styles.colSubtitle}>Danh sách giảng dạy và học tập trong ngày</p>
              </div>
            </div>
            
            <div className={`card ${styles.scrollContainer}`}>
              {fetching ? (
                <p className={styles.emptyText}>Đang tải lịch học…</p>
              ) : !data?.todaySchedules?.length ? (
                <p className={styles.emptyText}>Hôm nay hệ thống không có lịch học nào.</p>
              ) : (
                <div className={styles.scheduleList}>
                  {data.todaySchedules.map((schedule) => (
                    <div key={schedule.malichhoc} className={styles.scheduleItem}>
                      <div className={styles.timeBlock}>
                        <span className={styles.timeLabel}>Tiết</span>
                        <span className={styles.timeValue}>{schedule.tietbatdau}-{schedule.tietketthuc}</span>
                      </div>
                      <div className={styles.scheduleDetails}>
                        <h3 className={styles.scheduleSubject}>{schedule.monhoc}</h3>
                        <div className={styles.scheduleTeacher}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>Dạy bởi: <strong>{schedule.giangvien}</strong></span>
                        </div>
                        <div className={styles.scheduleMeta}>
                          <span className="badge badge-peach">Lớp: {schedule.lop}</span>
                          <span className="badge badge-blue">
                            Phòng: {schedule.phonghoc || "N/A"}
                          </span>
                          {schedule.loaiphong && (
                            <span className={`badge ${schedule.loaiphong === "Thuchanh" ? "badge-yellow" : schedule.loaiphong === "Online" ? "badge-red" : "badge-green"}`}>
                              {schedule.loaiphong === "Lythuyet" ? "Lý thuyết" : schedule.loaiphong === "Thuchanh" ? "Thực hành" : "Trực tuyến"}
                            </span>
                          )}
                        </div>
                        {schedule.ghichu && (
                          <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#8B6F5F", fontStyle: "italic" }}>
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
          <div className={styles.gridCol}>
            <div className={styles.colHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C25450" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <div>
                <h2 className={styles.colTitle}>Nhật ký hệ thống</h2>
                <p className={styles.colSubtitle}>Giám sát lịch sử hoạt động thời gian thực</p>
              </div>
            </div>

            <div className={`card ${styles.scrollContainer}`}>
              {fetching ? (
                <p className={styles.emptyText}>Đang tải lịch sử nhật ký…</p>
              ) : !data?.auditLogs?.length ? (
                <p className={styles.emptyText}>Chưa có ghi chép lịch sử hoạt động nào.</p>
              ) : (
                <div className={styles.logList}>
                  {data.auditLogs.map((log) => (
                    <div key={log.manhatky} className={styles.logItem}>
                      <div className={styles.logBullet} />
                      <div className={styles.logContent}>
                        <p className={styles.logText}>{log.hanhdong}</p>
                        <div className={styles.logMeta}>
                          <span className={styles.logEmail}>
                            👤 {log.taikhoan ? `${log.taikhoan.email} (${log.taikhoan.vaitro === "Admin" ? "Quản trị" : log.taikhoan.vaitro === "GiangVien" ? "Giảng viên" : "Sinh viên"})` : log.mataikhoan}
                          </span>
                          <span>
                            🕒 {new Date(log.ngaytao).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} • <span className={styles.logIp}>{log.diachiip}</span>
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
      {showDetailModal && (
        <AdminModal
          title={selectedType === "sv" ? "Hồ sơ chi tiết Sinh viên" : "Hồ sơ chi tiết Giảng viên"}
          onClose={() => setShowDetailModal(false)}
          size="lg"
        >
          {detailLoading ? (
            <p className={styles.emptyText}>Đang tải chi tiết hồ sơ từ cơ sở dữ liệu…</p>
          ) : !selectedDetail ? (
            <p className={styles.emptyText}>Không tìm thấy hồ sơ chi tiết.</p>
          ) : selectedType === "sv" ? (
            <div>
              {/* Header Banner */}
              <div className={styles.detailHeader}>
                <div className={styles.avatarPlaceholder}>
                  {selectedDetail.hoten?.charAt(0) || "S"}
                </div>
                <div className={styles.headerMeta}>
                  <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#2D1B14", margin: 0 }}>
                    {selectedDetail.hoten}
                  </h3>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <span className="badge badge-peach">Sinh viên</span>
                    <span className={`badge ${SV_STATUS_BADGE[selectedDetail.trangthai] ?? "badge-peach"}`}>
                      {STATUS_LABEL[selectedDetail.trangthai] ?? selectedDetail.trangthai}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <h4 className={styles.modalSectionTitle}>Thông tin cá nhân</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Ngày sinh</span>
                  <span className={styles.fieldValue}>
                    {selectedDetail.ngaysinh
                      ? new Date(selectedDetail.ngaysinh).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Giới tính</span>
                  <span className={styles.fieldValue}>{selectedDetail.gioitinh || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Số điện thoại</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.sodienthoai || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Email cá nhân</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.emailcanhan || "—"}</span>
                </div>
                <div className={styles.detailField} style={{ gridColumn: "span 2" }}>
                  <span className={styles.fieldLabel}>Quê quán (Hộ khẩu thường trú)</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.quequan || "—"}</span>
                </div>
              </div>

              {/* Section 2 */}
              <h4 className={styles.modalSectionTitle}>Thông tin học tập</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Mã số sinh viên (MSSV)</span>
                  <span className={styles.fieldValue}><code>{selectedDetail.masv}</code></span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Lớp học</span>
                  <span className={styles.fieldValue}>{selectedDetail.lop?.tenlop || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Email trường cấp</span>
                  <span className={styles.fieldValue}>{selectedDetail.emailtruong || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Khoa trực thuộc</span>
                  <span className={styles.fieldValue}>{selectedDetail.lop?.khoa?.tenkhoa || "—"}</span>
                </div>
                <div className={styles.detailField} style={{ gridColumn: "span 2" }}>
                  <span className={styles.fieldLabel}>Địa chỉ tạm trú hiện tại</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.diachi || "—"}</span>
                </div>
              </div>

              {/* Section 3 */}
              <h4 className={styles.modalSectionTitle}>Giấy tờ pháp lý & Thân nhân</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Số CCCD/CMND</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.cccd || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Cấp ngày & Nơi cấp</span>
                  <span className={styles.fieldValue}>
                    {selectedDetail.chitietsinhvien?.ngaycapcccd
                      ? `${new Date(selectedDetail.chitietsinhvien.ngaycapcccd).toLocaleDateString("vi-VN")} `
                      : ""}
                    {selectedDetail.chitietsinhvien?.noicapcccd ? `(${selectedDetail.chitietsinhvien.noicapcccd})` : "—"}
                  </span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Họ tên người bảo hộ (Phụ huynh)</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.tenphuhuynh || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>SĐT liên hệ phụ huynh</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.sodienthoaiphuhuynh || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Dân tộc</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.dantoc || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Tôn giáo</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietsinhvien?.tongiao || "—"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Lecturer Header */}
              <div className={styles.detailHeader}>
                <div className={styles.avatarPlaceholder}>
                  {selectedDetail.hoten?.charAt(0) || "G"}
                </div>
                <div className={styles.headerMeta}>
                  <h3 style={{ fontSize: "19px", fontWeight: "700", color: "#2D1B14", margin: 0 }}>
                    {selectedDetail.hoten}
                  </h3>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <span className="badge badge-blue">Giảng viên</span>
                    {selectedDetail.hocvi && <span className="badge badge-green">{selectedDetail.hocvi}</span>}
                  </div>
                </div>
              </div>

              {/* Section 1 */}
              <h4 className={styles.modalSectionTitle}>Thông tin cá nhân</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Ngày sinh</span>
                  <span className={styles.fieldValue}>
                    {selectedDetail.ngaysinh
                      ? new Date(selectedDetail.ngaysinh).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Giới tính</span>
                  <span className={styles.fieldValue}>{selectedDetail.gioitinh || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Số điện thoại di động</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietgiangvien?.sodienthoai || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Email cá nhân</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietgiangvien?.emailcanhan || "—"}</span>
                </div>
                <div className={styles.detailField} style={{ gridColumn: "span 2" }}>
                  <span className={styles.fieldLabel}>Địa chỉ cư trú</span>
                  <span className={styles.fieldValue}>{selectedDetail.chitietgiangvien?.diachi || "—"}</span>
                </div>
              </div>

              {/* Section 2 */}
              <h4 className={styles.modalSectionTitle}>Học hàm học vị & Khoa</h4>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Mã số giảng viên (Mã GV)</span>
                  <span className={styles.fieldValue}><code>{selectedDetail.magv}</code></span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Khoa công tác</span>
                  <span className={styles.fieldValue}>{selectedDetail.khoa?.tenkhoa || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Chuyên ngành chính</span>
                  <span className={styles.fieldValue}>{selectedDetail.chuyennganh || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Trình độ / Học vị</span>
                  <span className={styles.fieldValue}>{selectedDetail.hocvi || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Email trường cấp</span>
                  <span className={styles.fieldValue}>{selectedDetail.emailtruong || "—"}</span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Ngày tiếp nhận công tác</span>
                  <span className={styles.fieldValue}>
                    {selectedDetail.chitietgiangvien?.ngayvaotruong
                      ? new Date(selectedDetail.chitietgiangvien.ngayvaotruong).toLocaleDateString("vi-VN")
                      : "—"}
                  </span>
                </div>
                <div className={styles.detailField}>
                  <span className={styles.fieldLabel}>Hệ số lương</span>
                  <span className={styles.fieldValue}>
                    {selectedDetail.chitietgiangvien?.hesoluong !== undefined && selectedDetail.chitietgiangvien?.hesoluong !== null
                      ? Number(selectedDetail.chitietgiangvien.hesoluong).toFixed(2)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </AdminModal>
      )}
    </DashboardShell>
  );
}