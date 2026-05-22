"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/utils/supabase/client";
import { VaiTro } from "@/types";
import { getVietnamTimeISO } from "@/lib/utils/date";
import { apiFetch } from "@/services/service/auth/auth.service";
import { StudentProfileModal } from "@/components/student/ProfileModal";
import { ChangePasswordModal } from "../../teacher/dashboard/changepass";
import { parseNotificationContent } from "@/components/admin/NotificationForms";
import styles from "./student-dashboard.module.css";


// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  monHocCount: number;
  // GPA từ view_gpa_sinhvien
  gpa10_hocky_hientai: number;
  gpa4_hocky_hientai: number;
  gpa10_tich_luy: number;
  gpa4_tich_luy: number;
  xep_loai_hoc_luc: string | null;
  soBuoiVang: number;
  soBaiTapConHan: number;
  lichHocHomNay: {
    tenmon: string;
    phonghoc: string | null;
    tietbatdau: number;
    tietketthuc: number;
  }[];
  thongBaoGanDay: { tieude: string; ngaytao: string; loai: string }[];
  diemGanDay: {
    tenmon: string;
    chuyencan: number | string;
    giuaky: number | string;
    cuoiky: number | string;
    tongket: number | string;
    diemchu: string | null;
  }[];
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`card ${styles.statCard} ${accent ? styles.statAccent : ""}`}
    >
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  // States quản lý trạng thái ẩn hiện Popover và Modal
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State mở StudentProfileModal
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
        const res = await apiFetch("/api/sinhvien/notifications");
        const json = await res.json();
        if (json.success && json.data) {
          // Lấy tối đa 5 thông báo mới nhất
          setBellNotifications(json.data.slice(0, 5));
          setUnreadBellCount(json.unreadCount ?? 0);
        }
      } catch (err) {
        console.error("Failed to load bell notifications:", err);
      }
    }
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/sinhvien/notifications", {
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

  // Route guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.SinhVien)
      router.replace("/login");
  }, [user, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user?.maSinhVien) return;
    const masv = user.maSinhVien;
    const supabase = createClient();

    async function load() {
      setFetching(true);
      try {
        // Parallel queries
        // Fetch Student Info, Assignments & GPA view
        const [{ data: svInfo }, { data: svMonHoc }, gpaResponse] = await Promise.all([
          supabase.from("sinhvien").select("malop").eq("masv", masv).single(),
          supabase
            .from("sinhvienmonhoc")
            .select("maphancong")
            .eq("masv", masv)
            .eq("trangthai", "Danghoc"),
          apiFetch("/api/student/grades?mahocky=all").then(r => r.json()).catch(() => null),
        ]);

        const gpaView = gpaResponse?.gpaView;

        const myLop = svInfo?.malop;
        const myAssignments = (svMonHoc ?? []).map((m) => m.maphancong);

        // Fetch filtered notifications
        // Logic:
        // 1. doituong is "Tatca"
        // 2. OR (doituong is "SinhVien" AND (malop is null OR malop == myLop))
        // 3. OR (doituong is NOT "GiangVien" AND maphancong is in myAssignments)

        let conditions = [
          "doituong.eq.Tatca",
          `and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${myLop || "NONE"}))`,
        ];

        if (myAssignments.length > 0) {
          conditions.push(
            `and(doituong.neq.GiangVien,maphancong.in.(${myAssignments.join(",")}))`,
          );
        }

        const { data: thongBao } = await supabase
          .from("thongbao")
          .select("tieude, ngaytao, loai")
          .or(conditions.join(","))
          .lte("ngaytao", getVietnamTimeISO())
          .order("ngaytao", { ascending: false })
          .limit(5);

        const [
          { data: lichHoc },
          { data: diemDanh },
        ] = await Promise.all([
          supabase
            .from("lichhoc")
            .select(`
              tietbatdau,
              tietketthuc,
              maphong,
              phancong!inner (
                monhoc (tenmon)
              )
            `)
            .eq("phancong.danghieuluc", true)
            .or(`malop.eq.${myLop || "NONE"},maphancong.in.(${myAssignments.length > 0 ? myAssignments.join(",") : "0"})`, { foreignTable: "phancong" })
            .or(`ngayketthuc.is.null,ngayketthuc.gte.${new Date(new Date().getTime() + 7 * 3600 * 1000).toISOString().split("T")[0]}`, { foreignTable: "phancong" })
            .eq(
              "thutrongtuan",
              new Date(new Date().getTime() + 7 * 3600 * 1000).getUTCDay() === 0 ? 8 : new Date(new Date().getTime() + 7 * 3600 * 1000).getUTCDay() + 1
            )
            .limit(10),
          supabase
            .from("diemdanh")
            .select("trangthai")
            .eq("masv", masv)
            .eq("trangthai", "Vangmat"),
        ]);

        // GPA lấy từ view_gpa_sinhvien (đã xử lý học lại, thang VNUA)

        // Lọc bài tập chưa nộp thuộc các môn SV đang học
        let unsubmittedCount = 0;
        if (myAssignments.length > 0) {
          const { data: allBT } = await supabase
            .from("baitap")
            .select("mabaitap")
            .in("maphancong", myAssignments);

          if (allBT && allBT.length > 0) {
            const maBTs = allBT.map(b => b.mabaitap);
            const { data: submittedBT } = await supabase
              .from("nopbai")
              .select("mabaitap")
              .eq("masv", masv)
              .in("mabaitap", maBTs);

            const submittedIDs = new Set((submittedBT ?? []).map(s => s.mabaitap));
            unsubmittedCount = allBT.filter(b => !submittedIDs.has(b.mabaitap)).length;
          }
        }

        setData({
          monHocCount: svMonHoc?.length ?? 0,
          gpa10_hocky_hientai: gpaView?.gpa10_hocky_hientai ?? 0,
          gpa4_hocky_hientai:  gpaView?.gpa4_hocky_hientai  ?? 0,
          gpa10_tich_luy:      gpaView?.gpa10_tich_luy       ?? 0,
          gpa4_tich_luy:       gpaView?.gpa4_tich_luy        ?? 0,
          xep_loai_hoc_luc:    gpaView?.xep_loai_hoc_luc     ?? null,
          soBuoiVang: diemDanh?.length ?? 0,
          soBaiTapConHan: unsubmittedCount,
          lichHocHomNay: (lichHoc ?? []).map((lh: any) => ({
            tenmon: lh.phancong?.monhoc?.tenmon ?? "—",
            phonghoc: lh.maphong ?? "—",
            tietbatdau: lh.tietbatdau,
            tietketthuc: lh.tietketthuc,
          })),
          thongBaoGanDay: (thongBao ?? []).map((t) => ({
            ...t,
            ngaytao: new Date(t.ngaytao).toLocaleDateString("vi-VN"),
          })),
          diemGanDay: (gpaResponse?.grades ?? []).slice(0, 5).map((g: any) => {
            const cc = g.diemThanhPhan.find((d: any) => d.loai === "ChuyenCan")?.giatri;
            const gk = g.diemThanhPhan.find((d: any) => d.loai === "GiuaKy")?.giatri;
            const ck = g.diemThanhPhan.find((d: any) => d.loai === "CuoiKy")?.giatri;
            return {
              tenmon: g.tenmon,
              chuyencan: cc !== undefined && cc !== null ? cc.toFixed(1) : "—",
              giuaky: gk !== undefined && gk !== null ? gk.toFixed(1) : "—",
              cuoiky: ck !== undefined && ck !== null ? ck.toFixed(1) : "—",
              tongket: g.diem10 !== null ? g.diem10.toFixed(1) : "—",
              diemchu: g.diemchu
            };
          }),
        });
      } catch {
        // Keep null data — show empty states
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user]);

  if (loading || !user) return null;

  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <DashboardShell pageTitle="Tổng quan">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className={styles.date}>{today}</p>
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
                              router.push(`/student/notifications?id=${notif.mathongbao}`);
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
                      onClick={() => router.push("/student/notifications")}
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
                <div className="w-[34px] h-[34px] rounded-full bg-[#FFF2EB] text-[#8B6F5F] flex items-center justify-center shrink-0 border border-[#EAD9CB] overflow-hidden">
                  {user.anhdaidien ? (
                    <img src={user.anhdaidien} alt={user.hoten} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-[#8B6F5F]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[13px] font-semibold text-[#2D1B14]">SV. {user?.hoten || "—"}</span>
                  <span className="text-[11px] text-[#8B6F5F]">Sinh viên · {user?.maSinhVien}</span>
                </div>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {isProfileOpen && (
                <div className="absolute top-[48px] right-0 w-[220px] bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 flex flex-col">
                  {/* Nút Thông tin cá nhân */}
                  <button 
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => {
                      setIsModalOpen(true); // Mở StudentProfileModal
                      setIsProfileOpen(false);
                    }}
                  >
                    Thông tin cá nhân
                  </button>

                  {/* Nút Thay đổi mật khẩu */}
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

                  {/* Nút Đăng xuất */}
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

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Môn đang học"
            value={fetching ? "…" : (data?.monHocCount ?? 0)}
            sub="học kỳ này"
          />
          <StatCard
            label="GPA kỳ hiện tại"
            value={fetching ? "…" : (data?.gpa10_hocky_hientai ?? 0).toFixed(2)}
            sub={`Thang 4: ${fetching ? "…" : (data?.gpa4_hocky_hientai ?? 0).toFixed(2)}`}
            accent
          />
          <StatCard
            label="GPA tích lũy"
            value={fetching ? "…" : (data?.gpa10_tich_luy ?? 0).toFixed(2)}
            sub={data?.xep_loai_hoc_luc ?? `H4: ${(data?.gpa4_tich_luy ?? 0).toFixed(2)}`}
          />
          <StatCard
            label="Buổi vắng"
            value={fetching ? "…" : (data?.soBuoiVang ?? 0)}
            sub="lần vắng mặt"
          />
          <StatCard
            label="Bài tập còn hạn"
            value={fetching ? "…" : (data?.soBaiTapConHan ?? 0)}
            sub="cần nộp"
          />
        </div>

        {/* Two-col grid */}
        <div className={styles.twoCol}>
          {/* Lịch hôm nay */}
          <section className="card" aria-labelledby="schedule-today">
            <div className={styles.cardHeader}>
              <h2 id="schedule-today" className={styles.sectionTitle}>
                Lịch học hôm nay
              </h2>
            </div>
            {fetching ? (
              <p className={styles.emptyText}>Đang tải…</p>
            ) : !data?.lichHocHomNay.length ? (
              <p className={styles.emptyText}>Hôm nay không có tiết học 🎉</p>
            ) : (
              <ul className={styles.scheduleList} role="list">
                {data.lichHocHomNay.map((item, i) => (
                  <li key={i} className={styles.scheduleItem}>
                    <div className={styles.scheduleTime}>
                      <span>T{item.tietbatdau}</span>
                      <span className={styles.scheduleTimeSep}>—</span>
                      <span>T{item.tietketthuc}</span>
                    </div>
                    <div className={styles.scheduleInfo}>
                      <span className={styles.scheduleName}>{item.tenmon}</span>
                      <span className={styles.scheduleRoom}>
                        {item.phonghoc ?? "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Điểm gần đây */}
          <section className="card" aria-labelledby="recent-grades">
            <div className={styles.cardHeader}>
              <h2 id="recent-grades" className={styles.sectionTitle}>
                Điểm gần đây
              </h2>
            </div>
            {fetching ? (
              <p className={styles.emptyText}>Đang tải…</p>
            ) : !data?.diemGanDay.length ? (
              <p className={styles.emptyText}>Chưa có điểm nào được công bố.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
              <table className="data-table" aria-label="Bảng điểm gần đây">
                <thead>
                  <tr style={{ background: "#fff8f5" }}>
                    <th style={{ padding: "10px 14px", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", color: "#8b6f5f" }}>Môn học</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", color: "#8b6f5f" }}>Chuyên cần</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", color: "#8b6f5f" }}>Giữa kỳ</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", color: "#8b6f5f" }}>Cuối kỳ</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.06em", color: "#8b6f5f" }}>Tổng kết</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diemGanDay.map((d, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fffaf8" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#2d1b14" }}>{d.tenmon}</td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: d.chuyencan === "—" ? "#9ca3af" : "#2d1b14" }}>
                        {d.chuyencan}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: d.giuaky === "—" ? "#9ca3af" : "#2d1b14" }}>
                        {d.giuaky}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, color: d.cuoiky === "—" ? "#9ca3af" : "#2d1b14" }}>
                        {d.cuoiky}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {d.tongket !== "—" ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <strong style={{
                              color: Number(d.tongket) >= 4.0 ? "#065f46" : "#991b1b",
                              fontSize: 14,
                            }}>
                              {d.tongket}
                            </strong>
                            {d.diemchu && (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 800,
                                background: "#f5ede8",
                                color: "#c25450",
                                padding: "2px 6px",
                                borderRadius: 12,
                                border: "1px solid #ead9cb"
                              }}>
                                {d.diemchu}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#d1d5db", fontStyle: "italic" }}>Chưa có</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </section>
        </div>

        {/* Thông báo */}
        <section className="card" aria-labelledby="notifications">
          <div className={styles.cardHeader}>
            <h2 id="notifications" className={styles.sectionTitle}>
              Thông báo gần đây
            </h2>
          </div>
          {fetching ? (
            <p className={styles.emptyText}>Đang tải…</p>
          ) : !data?.thongBaoGanDay.length ? (
            <p className={styles.emptyText}>Không có thông báo mới.</p>
          ) : (
            <ul className={styles.notifList} role="list">
              {data.thongBaoGanDay.map((tb, i) => (
                <li key={i} className={styles.notifItem}>
                  <div className={styles.notifDot} aria-hidden />
                  <div className={styles.notifContent}>
                    <span className={styles.notifTitle}>{tb.tieude}</span>
                    <span className={styles.notifMeta}>
                      {tb.ngaytao} · {tb.loai}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 👇 GỌI CÁC MODAL THÔNG TIN VÀ ĐỔI MẬT KHẨU CỦA SINH VIÊN */}
      <StudentProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
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
