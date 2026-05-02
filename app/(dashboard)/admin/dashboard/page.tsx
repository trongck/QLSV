"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/utils/supabase/client";
import { VaiTro, TrangThaiSinhVien } from "@/types";
import styles from "./admin-dashboard.module.css";

interface AdminData {
  totalSV:   number;
  totalGV:   number;
  totalLop:  number;
  totalKhoa: number;
  svByStatus: { trangthai: string; count: number }[];
  recentSV: { masv: string; hoten: string; tenlop: string; trangthai: string }[];
  recentGV: { magv: string; hoten: string; tenkhoa: string; hocvi: string | null }[];
}

const STATUS_LABEL: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]:   "Đang học",
  [TrangThaiSinhVien.Baoluu]:    "Bảo lưu",
  [TrangThaiSinhVien.Thoi]:      "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className={`card ${styles.statCard}`} style={color ? { borderTop: `3px solid ${color}` } : {}}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [data, setData]     = useState<AdminData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"sv" | "gv">("sv");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.Admin) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function load() {
      setFetching(true);
      try {
        const [
          { count: totalSV },
          { count: totalGV },
          { count: totalLop },
          { count: totalKhoa },
          { data: svList },
          { data: gvList },
        ] = await Promise.all([
          supabase.from("sinhvien").select("masv", { count: "exact", head: true }),
          supabase.from("giangvien").select("magv", { count: "exact", head: true }),
          supabase.from("lop").select("malop", { count: "exact", head: true }),
          supabase.from("khoa").select("makhoa", { count: "exact", head: true }),
          supabase
            .from("sinhvien")
            .select("masv, hoten, trangthai, lop(tenlop)")
            .order("masv", { ascending: false })
            .limit(8),
          supabase
            .from("giangvien")
            .select("magv, hoten, hocvi, khoa(tenkhoa)")
            .order("magv", { ascending: false })
            .limit(8),
        ]);

        // Group SV by status
        const statusMap: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (svList ?? []).forEach((sv: any) => {
          statusMap[sv.trangthai] = (statusMap[sv.trangthai] ?? 0) + 1;
        });

        setData({
          totalSV:   totalSV ?? 0,
          totalGV:   totalGV ?? 0,
          totalLop:  totalLop ?? 0,
          totalKhoa: totalKhoa ?? 0,
          svByStatus: Object.entries(statusMap).map(([trangthai, count]) => ({ trangthai, count })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recentSV: (svList ?? []).map((sv: any) => ({
            masv:     sv.masv,
            hoten:    sv.hoten,
            tenlop:   sv.lop?.tenlop ?? "—",
            trangthai: sv.trangthai,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recentGV: (gvList ?? []).map((gv: any) => ({
            magv:    gv.magv,
            hoten:   gv.hoten,
            tenkhoa: gv.khoa?.tenkhoa ?? "—",
            hocvi:   gv.hocvi ?? null,
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

  const svStatusColors: Record<string, string> = {
    [TrangThaiSinhVien.Danghoc]:   "badge-green",
    [TrangThaiSinhVien.Baoluu]:    "badge-yellow",
    [TrangThaiSinhVien.Thoi]:      "badge-red",
    [TrangThaiSinhVien.Totnghiep]: "badge-blue",
  };

  return (
    <DashboardShell pageTitle="Quản trị hệ thống">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Tổng quan hệ thống</h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </p>
          </div>
          <span className="badge badge-red">Quản trị viên</span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard label="Tổng sinh viên" value={fetching ? "…" : data?.totalSV ?? 0}   color="#C25450" />
          <StatCard label="Giảng viên"     value={fetching ? "…" : data?.totalGV ?? 0}   color="#1E40AF" />
          <StatCard label="Lớp học"        value={fetching ? "…" : data?.totalLop ?? 0}  color="#065F46" />
          <StatCard label="Khoa"           value={fetching ? "…" : data?.totalKhoa ?? 0} color="#713F12" />
        </div>

        {/* Tabs: SV / GV */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "sv"}
            className={`${styles.tab} ${activeTab === "sv" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("sv")}
          >
            Sinh viên gần đây
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "gv"}
            className={`${styles.tab} ${activeTab === "gv" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("gv")}
          >
            Giảng viên gần đây
          </button>
        </div>

        <section className="card" aria-label={activeTab === "sv" ? "Danh sách sinh viên" : "Danh sách giảng viên"}>
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
                    {data!.recentSV.map(sv => (
                      <tr key={sv.masv}>
                        <td><code style={{ fontSize: "12px" }}>{sv.masv}</code></td>
                        <td><strong style={{ color: "#2D1B14" }}>{sv.hoten}</strong></td>
                        <td>{sv.tenlop}</td>
                        <td>
                          <span className={`badge ${svStatusColors[sv.trangthai] ?? "badge-peach"}`}>
                            {STATUS_LABEL[sv.trangthai] ?? sv.trangthai}
                          </span>
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                            Xem
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
                    {data!.recentGV.map(gv => (
                      <tr key={gv.magv}>
                        <td><code style={{ fontSize: "12px" }}>{gv.magv}</code></td>
                        <td><strong style={{ color: "#2D1B14" }}>{gv.hoten}</strong></td>
                        <td>{gv.tenkhoa}</td>
                        <td>
                          {gv.hocvi ? (
                            <span className="badge badge-blue">{gv.hocvi}</span>
                          ) : "—"}
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                            Xem
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
      </div>
    </DashboardShell>
  );
}
