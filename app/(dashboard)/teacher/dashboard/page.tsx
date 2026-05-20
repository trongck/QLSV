"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/auth.service";
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

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.GiangVien)
      router.replace("/login");
  }, [user, loading, router]);

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
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>
              Chào, {user.hoten?.split(" ").pop()} 👋
            </h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="badge badge-blue">
            Giảng viên · {user.maGiangVien}
          </span>
        </div>

        {/* Stats */}
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
    </DashboardShell>
  );
}
