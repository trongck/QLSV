"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/service/auth/auth.service";
import { ProfileModal } from "@/components/teacher/ProfileModal"; // <-- Hãy đảm bảo đường dẫn này đúng trong dự án của bạn
import { ChangePasswordModal } from "./changepass";
import { parseNotificationContent } from "@/components/admin/NotificationForms";

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
    <div className="card p-[18px_20px] flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-fg-subtle uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold text-fg leading-none">{value}</span>
      {sub && <span className="text-[12px] text-fg-subtle">{sub}</span>}
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
  const [isChangePassOpen, setIsChangePassOpen] = useState(false); // State mở ChangePasswordModal
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false); // State mở custom logout confirm
  const [bellNotifications, setBellNotifications] = useState<any[]>([]);
  const [unreadBellCount, setUnreadBellCount] = useState(0);

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
    setIsProfileOpen(false);
  };

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await apiFetch("/api/giangvien/notifications?limit=5");
        const json = await res.json();
        if (json.success && json.data) {
          setBellNotifications(json.data.slice(0, 5));
          const unread = json.data.filter((tb: any) => !tb.dadoc).length;
          setUnreadBellCount(unread);
        }
      } catch (err) {
        console.error("Failed to load lecturer bell notifications:", err);
      }
    }
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/giangvien/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      const json = await res.json();
      if (json.success) {
        setBellNotifications(prev => prev.map(n => ({ ...n, dadoc: true })));
        setUnreadBellCount(0);
      }
    } catch (err) {
      console.error(err);
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        
        {/* ĐÂY LÀ PHẦN THAY THẾ: Lời chào nằm bên trái --- Cụm Avatar + Chuông nằm bên phải thay thế cho badge cũ */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-fg m-0 mb-1">
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className="text-[13px] text-fg-subtle m-0 capitalize">
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
              <button 
                type="button"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-100 flex items-center justify-center relative cursor-pointer transition-colors shadow-sm animate-none"
                style={{ border: "1px solid #ead9cb" }}
              >
                <svg className="w-[22px] h-[22px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadBellCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute top-[48px] right-0 w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Thông báo của bạn</span>
                    {unreadBellCount > 0 && (
                      <span 
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-emerald-600 font-semibold cursor-pointer hover:underline"
                      >
                        Đánh dấu đã đọc
                      </span>
                    )}
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {bellNotifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        Không có thông báo nào
                      </div>
                    ) : (
                      bellNotifications.map((notif: any) => {
                        const parsed = parseNotificationContent(notif.noidung || "");
                        return (
                          <div 
                            key={notif.mathongbao}
                            onClick={() => {
                              router.push(`/teacher/notification?id=${notif.mathongbao}`);
                            }}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col gap-1 ${!notif.dadoc ? 'bg-orange-50/40' : ''}`}
                          >
                            <p className={`text-xs text-gray-700 m-0 ${!notif.dadoc ? 'font-semibold text-[#C25450]' : ''}`}>
                              {notif.tieude}
                            </p>
                            <p className="text-[10px] text-gray-500 m-0 line-clamp-1">
                              {parsed.text}
                            </p>
                            <span className="text-[9px] text-gray-400">
                              {new Date(notif.ngaytao).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit"
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <span 
                      onClick={() => router.push("/teacher/notification")}
                      className="text-xs text-[#C25450] font-semibold cursor-pointer hover:underline"
                    >
                      Xem tất cả thông báo
                    </span>
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
      Thông tin cá nhân
    </button>

    {/* 3. Nút Thay đổi mật khẩu */}
    <button 
      className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
      onClick={() => {
        setIsChangePassOpen(true);
        setIsProfileOpen(false);
      }}
    >
      Thay đổi mật khẩu
    </button>

    <hr className="border-gray-100 my-1.5" />

    {/* 4. Nút Đăng xuất */}
    <button 
      className="w-full text-left px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
      onClick={handleLogout}
    >
      Đăng xuất
    </button>
  </div>
)}
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
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
          <div className="p-[16px_20px_12px] border-b border-border">
            <h2 id="classes-table" className="text-sm font-bold text-fg m-0">
              Lớp học đang phụ trách
            </h2>
          </div>
          {fetching ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Đang tải…</p>
          ) : !data?.classSummaries.length ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Không có lớp nào đang hoạt động.</p>
          ) : (
            <div className="overflow-x-auto">
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
                        <strong className="text-fg font-bold">{c.tenmon}</strong>
                      </td>
                      <td>{c.tenlop}</td>
                      <td>{c.siso}</td>
                      <td>
                        {c.diemtb !== null ? (
                          <span className={`font-semibold ${c.diemtb >= 5 ? "text-[#065F46]" : "text-[#991B1B]"}`}>
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
                          className="btn-secondary text-[12px] py-1 px-3"
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
          <div className="p-[16px_20px_12px] border-b border-border">
            <h2 id="my-notifications" className="text-sm font-bold text-fg m-0">
              Thông báo đã gửi
            </h2>
          </div>
          {fetching ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Đang tải…</p>
          ) : !data?.thongBao.length ? (
            <p className="p-5 text-[13px] text-fg-subtle text-center m-0">Chưa có thông báo nào.</p>
          ) : (
            <ul className="list-none p-0 px-4 m-0 flex flex-col" role="list">
              {data.thongBao.map((tb, i) => (
                <li key={i} className="flex items-start gap-3 p-[12px_4px] border-b border-border last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" aria-hidden />
                  <div>
                    <p className="text-[13px] font-semibold text-fg m-0 mb-1">{tb.tieude}</p>
                    <p className="text-[11px] text-fg-subtle m-0">{tb.ngaytao}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 👇 GỌI MODAL PROFILE TẠI ĐÂY ĐỂ ĐỒNG BỘ VỚI STATE TRONG FILE */}
      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* 👇 GỌI MODAL THAY ĐỔI MẬT KHẨU */}
      <ChangePasswordModal isOpen={isChangePassOpen} onClose={() => setIsChangePassOpen(false)} />

      {/* 👇 HỘP XÁC NHẬN ĐĂNG XUẤT ĐẸP ĐẼ */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 p-5 animate-fadeInUp flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-800 m-0">Xác nhận đăng xuất</h3>
            </div>
            <p className="text-xs text-gray-600 m-0">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?</p>
            <div className="flex justify-end gap-2 mt-1">
              <button 
                type="button" 
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button" 
                onClick={() => {
                  localStorage.removeItem("token");
                  sessionStorage.clear();
                  window.location.href = "/login";
                }}
                className="px-4 py-2 text-xs bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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