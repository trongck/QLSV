"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/service/auth/auth.service";
import { ProfileModal } from "@/components/teacher/ProfileModal"; // <-- Hãy đảm bảo đường dẫn này đúng trong dự án của bạn
import styles from "./teacher-dashboard.module.css";

interface ClassSummary {
  maphancong: number;
  tenmon: string;
  tenlop: string;
  siso: number;
  diemtb: number | null;
  tilechuyencan: number | null;
}

interface DashboardData {
  totalClasses: number;
  totalStudents: number;
  pendingTasks: number;
  classSummaries: ClassSummary[];
  thongBao: { tieude: string; ngaytao: string }[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className={`card ${styles.statCard}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

export default function TeacherDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  // 👇 KHAI BÁO CÁC STATE ĐIỀU KHIỂN CHỨC NĂNG (HẾT SẠCH LỖI GẠCH ĐỎ)
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State mở ProfileModal

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("token");
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  // Kiểm tra quyền giảng viên
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.GiangVien)
      router.replace("/login");
  }, [user, loading, router]);

  // Tải dữ liệu từ API
  useEffect(() => {
    if (!user?.maGiangVien) return;

    async function load() {
      setFetching(true);
      try {
        const res = await apiFetch("/api/giangvien/dashboard");
        const json = await res.json();
        if (json.success && json.data) {
          const stats = json.data;
          setData({
            totalClasses: stats.totalClasses ?? 0,
            totalStudents: stats.totalStudents ?? 0,
            pendingTasks: stats.pendingTasks ?? 0,
            classSummaries: stats.classSummaries ?? [],
            thongBao: (stats.thongBao ?? []).map((t: any) => ({
              tieude: t.tieude,
              ngaytao: new Date(t.ngaytao).toLocaleDateString("vi-VN"),
            })),
          });
        }
      } catch (err) {
        console.error("Lỗi tải dashboard:", err);
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user]);

  if (loading || !user) return null;

  return (
    <DashboardShell pageTitle="Tổng quan">
      <div className={`animate-fadeInUp ${styles.page}`}>
        
        {/* ĐÂY LÀ PHẦN THAY THẾ: Lời chào nằm bên trái --- Cụm Avatar + Chuông nằm bên phải thay thế cho badge cũ */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={styles.greeting} style={{ margin: 0 }}>
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className={styles.date} style={{ margin: '4px 0 0 0' }}>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>

          {/* CỤM CHUÔNG THÔNG BÁO VÀ AVATAR NẰM NGANG HÀNG VỚI XIN CHÀO */}
          <div className="flex items-center gap-4 relative">
            
            {/* 1. CỤM NÚT CHUÔNG VÀ POPUP THÔNG BÁO */}
            <div className="relative">
              <div 
                className="relative cursor-pointer p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
              >
                <svg className="w-[22px] h-[22px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              </div>

              {isNotificationOpen && (
                <div className="absolute top-[45px] right-0 w-[300px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 font-semibold bg-gray-50 border-b border-gray-200 text-gray-800 text-sm">Thông báo mới nhất</div>
                  <div className="max-h-[240px] overflow-y-auto">
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <p className="text-xs text-gray-700 m-0">🔔 Hệ thống đã cập nhật lịch giảng dạy học kỳ mới.</p>
                      <span className="text-[10px] text-gray-400">10 phút trước</span>
                    </div>
                    <div className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <p className="text-xs text-gray-700 m-0">📝 Bạn có một danh sách điểm thi cần phê duyệt.</p>
                      <span className="text-[10px] text-gray-400">1 giờ trước</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. CỤM PROFILE AVATAR VÀ POPUP CHỨC NĂNG */}
            <div className="relative">
              <div 
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
              >
                <div className="w-[34px] h-[34px] rounded-full bg-[#FFF2EB] text-[#8B6F5F] flex items-center justify-center shrink-0 border border-[#EAD9CB]">
                  <svg className="w-5 h-5 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-semibold text-[#2D1B14]">GV. {user?.hoten || "—"}</span>
                  <span className="text-[11px] text-[#8B6F5F]">Giảng viên · {user?.maGiangVien}</span>
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isProfileOpen && (
  <div className="absolute top-[48px] right-0 w-[220px] bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 flex flex-col">
    

    {/* 2. Nút Thông tin cá nhân */}
    <button 
      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
      onClick={() => {
        setIsModalOpen(true); // Mở ProfileModal
        setIsProfileOpen(false);
      }}
    >
      <span className="text-sm">👤</span> Thông tin cá nhân
    </button>

    {/* 3. Nút Thay đổi mật khẩu */}
    <button 
      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
      onClick={() => {
        // Sau này khi có modal đổi mật khẩu, bạn chỉ cần gọi state mở modal ở đây
        alert("Chức năng Thay đổi mật khẩu đang được triển khai!");
        setIsProfileOpen(false);
      }}
    >
      <span className="text-sm">🔑</span> Thay đổi mật khẩu
    </button>

    <hr className="border-gray-100 my-1.5" />

    {/* 4. Nút Đăng xuất */}
    <button 
      className="w-full text-left px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
      onClick={handleLogout}
    >
      <span className="text-sm">🚪</span> Đăng xuất
    </button>
  </div>
)}
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Lớp đang dạy"
            value={fetching ? "…" : (data?.totalClasses ?? 0)}
            sub="học kỳ này"
          />
          <StatCard
            label="Tổng sinh viên"
            value={fetching ? "…" : (data?.totalStudents ?? 0)}
            sub="sinh viên"
          />
          <StatCard
            label="Bài tập còn hạn"
            value={fetching ? "…" : (data?.pendingTasks ?? 0)}
            sub="cần chấm"
          />
        </div>

        {/* Classes table */}
        <section className="card" aria-labelledby="classes-table">
          <div className={styles.cardHeader}>
            <h2 id="classes-table" className={styles.sectionTitle}>
              Lớp học đang phụ trách
            </h2>
          </div>
          {fetching ? (
            <p className={styles.emptyText}>Đang tải…</p>
          ) : !data?.classSummaries.length ? (
            <p className={styles.emptyText}>Không có lớp nào đang hoạt động.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className="data-table" aria-label="Danh sách lớp">
                <thead>
                  <tr>
                    <th>Môn học</th>
                    <th>Lớp</th>
                    <th>Sĩ số</th>
                    <th>Điểm TB</th>
                    <th>Chuyên cần</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classSummaries.map((c) => (
                    <tr key={c.maphancong}>
                      <td>
                        <strong style={{ color: "#2D1B14" }}>{c.tenmon}</strong>
                      </td>
                      <td>{c.tenlop}</td>
                      <td>{c.siso}</td>
                      <td>
                        {c.diemtb !== null ? (
                          <span
                            style={{
                              color: c.diemtb >= 5 ? "#065F46" : "#991B1B",
                              fontWeight: 600,
                            }}
                          >
                            {c.diemtb.toFixed(1)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {c.tilechuyencan !== null ? (
                          <span
                            className={`badge ${c.tilechuyencan >= 0.8 ? "badge-green" : "badge-yellow"}`}
                          >
                            {Math.round(c.tilechuyencan * 100)}%
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: "12px", padding: "4px 12px" }}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Thông báo */}
        <section className="card" aria-labelledby="my-notifications">
          <div className={styles.cardHeader}>
            <h2 id="my-notifications" className={styles.sectionTitle}>
              Thông báo đã gửi
            </h2>
          </div>
          {fetching ? (
            <p className={styles.emptyText}>Đang tải…</p>
          ) : !data?.thongBao.length ? (
            <p className={styles.emptyText}>Chưa có thông báo nào.</p>
          ) : (
            <ul className={styles.notifList} role="list">
              {data.thongBao.map((tb, i) => (
                <li key={i} className={styles.notifItem}>
                  <div className={styles.notifDot} aria-hidden />
                  <div>
                    <p className={styles.notifTitle}>{tb.tieude}</p>
                    <p className={styles.notifMeta}>{tb.ngaytao}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 👇 GỌI MODAL PROFILE TẠI ĐÂY ĐỂ ĐỒNG BỘ VỚI STATE TRONG FILE */}
      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </DashboardShell>
  );
}