"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { apiFetch } from "@/services/auth.service";
import { VaiTro, TrangThaiSinhVien } from "@/types";
import type { AdminStats } from "@/app/api/admin/stats/route";
import styles from "./admin-dashboard.module.css";

// ─── Local types ──────────────────────────────────────────────────────────────

interface AdminData extends AdminStats {
  // AdminStats đã đủ — interface này giữ lại để mở rộng sau nếu cần
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

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className={`card ${styles.statCard}`} style={color ? { borderTop: `3px solid ${color}` } : {}}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  // FIX (Issue 10): dùng useAuth() — hook công khai duy nhất, không import useAuthContext trực tiếp
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData]         = useState<AdminData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<"sv" | "gv">("sv");

  // Route guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.Admin) router.replace("/login");
  }, [user, loading, router]);

  // FIX (Issue 9): gọi API route /api/admin/stats thay vì query Supabase trực tiếp từ component
  useEffect(() => {
    if (!user) return;

    async function load() {
      setFetching(true);
      try {
        const res = await apiFetch("/api/admin/stats");
        if (!res.ok) {
          // Đọc lỗi an toàn — tránh crash khi server trả HTML thay vì JSON
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
      } catch {
        // Giữ null data — hiện empty states
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user]);

  if (loading || !user) return null;

  return (
    <DashboardShell pageTitle="Quản trị hệ thống">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Tổng quan hệ thống</h1>
            <p className={styles.date}>
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
              })}
            </p>
          </div>
          <span className="badge badge-red">Quản trị viên</span>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard label="Tổng sinh viên" value={fetching ? "…" : data?.totalSV   ?? 0} color="#C25450" />
          <StatCard label="Giảng viên"     value={fetching ? "…" : data?.totalGV   ?? 0} color="#1E40AF" />
          <StatCard label="Lớp học"        value={fetching ? "…" : data?.totalLop  ?? 0} color="#065F46" />
          <StatCard label="Khoa"           value={fetching ? "…" : data?.totalKhoa ?? 0} color="#713F12" />
        </div>

        {/* Tabs */}
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