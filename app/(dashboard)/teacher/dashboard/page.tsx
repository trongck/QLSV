"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/service/auth/auth.service";

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

  // Route guard
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.vaitro !== VaiTro.GiangVien) router.replace("/login");
  }, [user, loading, router]);

  // Load dashboard data
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
        {/* Greeting */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3.5 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
          <StatCard label="Lớp đang dạy" value={fetching ? "…" : (data?.totalClasses ?? 0)} sub="học kỳ này" />
          <StatCard label="Tổng sinh viên" value={fetching ? "…" : (data?.totalStudents ?? 0)} sub="sinh viên" />
          <StatCard label="Bài tập còn hạn" value={fetching ? "…" : (data?.pendingTasks ?? 0)} sub="cần chấm" />
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
                      <td><strong className="text-fg font-bold">{c.tenmon}</strong></td>
                      <td>{c.tenlop}</td>
                      <td>{c.siso}</td>
                      <td>
                        {c.diemtb !== null ? (
                          <span className={`font-semibold ${c.diemtb >= 5 ? "text-[#065F46]" : "text-[#991B1B]"}`}>
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
                        <button className="btn-secondary text-[12px] py-1 px-3">Chi tiết</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Thông báo đã gửi */}
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
    </DashboardShell>
  );
}