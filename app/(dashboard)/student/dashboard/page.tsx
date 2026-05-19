"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/utils/supabase/client";
import { VaiTro } from "@/types";
import { getVietnamTimeISO } from "@/lib/utils/date";
import styles from "./student-dashboard.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  monHocCount: number;
  diemTBHK: number | null;
  soBuoiVang: number;
  soBaiTapConHan: number;
  lichHocHomNay: {
    tenmon: string;
    phonghoc: string | null;
    tietbatdau: number;
    tietketthuc: number;
  }[];
  thongBaoGanDay: { tieude: string; ngaytao: string; loai: string }[];
  diemGanDay: { maphancong: number; loaidiem: string; giatri: number }[];
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
        // Fetch Student Info & Assignments
        const [{ data: svInfo }, { data: svMonHoc }] = await Promise.all([
          supabase.from("sinhvien").select("malop").eq("masv", masv).single(),
          supabase
            .from("sinhvienmonhoc")
            .select("maphancong")
            .eq("masv", masv)
            .eq("trangthai", "Danghoc"),
        ]);

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
          { data: diemRows },
          { data: lichHoc },
          { data: diemDanh },
        ] = await Promise.all([
          supabase
            .from("diem")
            .select("loaidiem, giatri, maphancong")
            .eq("masv", masv)
            .order("ngaytao", { ascending: false })
            .limit(6),//
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

        // Compute GPA from diem rows
        let diemTBHK: number | null = null;
        if (diemRows && diemRows.length > 0) {
          const cuoiky = diemRows.filter((d) => d.loaidiem === "CuoiKy");
          if (cuoiky.length > 0) {
            diemTBHK = parseFloat(
              (
                cuoiky.reduce((s, d) => s + d.giatri, 0) / cuoiky.length
              ).toFixed(2),
            );
          }
        }

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
          diemTBHK,
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
          diemGanDay: diemRows ?? [],
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
          <span className="badge badge-peach">{user.maSinhVien}</span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard
            label="Môn đang học"
            value={fetching ? "…" : (data?.monHocCount ?? 0)}
            sub="học kỳ này"
          />
          <StatCard
            label="GPA học kỳ"
            value={
              fetching
                ? "…"
                : data?.diemTBHK !== null
                  ? data!.diemTBHK!.toFixed(2)
                  : "—"
            }
            sub="điểm hệ 10"
            accent
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
              <table className="data-table" aria-label="Bảng điểm gần đây">
                <thead>
                  <tr>
                    <th>Phân công</th>
                    <th>Loại</th>
                    <th>Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diemGanDay.map((d, i) => (
                    <tr key={i}>
                      <td>{d.maphancong}</td>
                      <td>
                        <span
                          className={`badge ${
                            d.loaidiem === "CuoiKy"
                              ? "badge-blue"
                              : d.loaidiem === "GiuaKy"
                                ? "badge-yellow"
                                : "badge-peach"
                          }`}
                        >
                          {d.loaidiem}
                        </span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: d.giatri >= 5 ? "#065F46" : "#991B1B",
                          }}
                        >
                          {d.giatri.toFixed(1)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </DashboardShell>
  );
}
