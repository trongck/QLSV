"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/utils/supabase/client";
import { VaiTro } from "@/types";
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
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
  const [data, setData]     = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.GiangVien) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.maGiangVien) return;
    const magv = user.maGiangVien;
    const supabase = createClient();

    async function load() {
      setFetching(true);
      try {
        const [
          { data: phancong },
          { data: thongBao },
          { data: baitap },
        ] = await Promise.all([
          supabase
            .from("phancong")
            .select(`
              maphancong,
              monhoc(tenmon),
              lop(tenlop, siso),
              thongkephancong(diemtb, tilechuyencan)
            `)
            .eq("magv", magv)
            .eq("danghieuluc", true),
          supabase
            .from("thongbao")
            .select("tieude, ngaytao")
            .eq("magvtao", magv)
            .order("ngaytao", { ascending: false })
            .limit(5),
          supabase
            .from("baitap")
            .select("mabaitap")
            .eq("magv", magv)
            .gt("hannop", new Date().toISOString()),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const classSummaries: ClassSummary[] = (phancong ?? []).map((pc: any) => ({
          maphancong:    pc.maphancong,
          tenmon:        pc.monhoc?.tenmon ?? "—",
          tenlop:        pc.lop?.tenlop ?? "—",
          siso:          pc.lop?.siso ?? 0,
          diemtb:        pc.thongkephancong?.diemtb ?? null,
          tilechuyencan: pc.thongkephancong?.tilechuyencan ?? null,
        }));

        const totalStudents = classSummaries.reduce((s, c) => s + c.siso, 0);

        setData({
          totalClasses:  classSummaries.length,
          totalStudents,
          pendingTasks:  baitap?.length ?? 0,
          classSummaries,
          thongBao: (thongBao ?? []).map(t => ({
            tieude:  t.tieude,
            ngaytao: new Date(t.ngaytao).toLocaleDateString("vi-VN"),
          })),
        });
      } catch {
        // keep null
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
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Chào, {user.hoten?.split(" ").pop()} 👋</h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          <span className="badge badge-blue">Giảng viên · {user.maGiangVien}</span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard label="Lớp đang dạy"  value={fetching ? "…" : data?.totalClasses ?? 0}  sub="học kỳ này" />
          <StatCard label="Tổng sinh viên" value={fetching ? "…" : data?.totalStudents ?? 0} sub="sinh viên" />
          <StatCard label="Bài tập còn hạn" value={fetching ? "…" : data?.pendingTasks ?? 0} sub="cần chấm" />
        </div>

        {/* Classes table */}
        <section className="card" aria-labelledby="classes-table">
          <div className={styles.cardHeader}>
            <h2 id="classes-table" className={styles.sectionTitle}>Lớp học đang phụ trách</h2>
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
                  {data.classSummaries.map(c => (
                    <tr key={c.maphancong}>
                      <td><strong style={{ color: "#2D1B14" }}>{c.tenmon}</strong></td>
                      <td>{c.tenlop}</td>
                      <td>{c.siso}</td>
                      <td>
                        {c.diemtb !== null ? (
                          <span style={{ color: c.diemtb >= 5 ? "#065F46" : "#991B1B", fontWeight: 600 }}>
                            {c.diemtb.toFixed(1)}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        {c.tilechuyencan !== null ? (
                          <span className={`badge ${c.tilechuyencan >= 0.8 ? "badge-green" : "badge-yellow"}`}>
                            {Math.round(c.tilechuyencan * 100)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
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
            <h2 id="my-notifications" className={styles.sectionTitle}>Thông báo đã gửi</h2>
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
    </DashboardShell>
  );
}
