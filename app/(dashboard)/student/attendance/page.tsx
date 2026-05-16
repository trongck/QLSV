"use client";
import { useState, useEffect, useCallback } from "react";
import AttendanceActions from "@/components/AttendanceActions";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { type DiemDanhRecord, type AttendanceSubjectStat } from "@/services/repositories/sinhvien/diemdanh.repo";
import AttendanceLogCard, { type LogEntry, type TrangThai } from "@/components/AttendanceLogCard";
import { BookOpen, TrendingUp, XCircle, Clock } from "lucide-react";
import { StatCard, EmptyState } from "@/components/student/StudentUI";

import { apiFetch } from "@/services/service/auth/auth.service";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

// ─── Subject Stats Row ─────────────────────────────────────────────────────────
function SubjectStatsRow({ stat }: { stat: AttendanceSubjectStat }) {
  const attendRate = stat.total > 0 ? Math.round(((stat.coMat + stat.muon) / stat.total) * 100) : 0;
  const barColor = attendRate >= 80 ? "bg-green-500" : attendRate >= 60 ? "bg-orange-400" : "bg-red-500";
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{stat.tenmon}</h4>
          <p className="text-xs text-gray-400">{stat.tenhocky}</p>
        </div>
        <span className={`text-sm font-bold ${attendRate >= 80 ? "text-green-600" : attendRate >= 60 ? "text-orange-500" : "text-red-600"}`}>
          {attendRate}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${attendRate}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div><div className="font-bold text-green-600">{stat.coMat}</div><div className="text-gray-400">Có mặt</div></div>
        <div><div className="font-bold text-orange-500">{stat.muon}</div><div className="text-gray-400">Muộn</div></div>
        <div><div className="font-bold text-blue-500">{stat.vangCoPhep}</div><div className="text-gray-400">V.CP</div></div>
        <div><div className="font-bold text-red-500">{stat.vangKhongPhep}</div><div className="text-gray-400">V.KP</div></div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<AttendanceSubjectStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [filter, setFilter] = useState<{ type: "month" | "semester"; mahocky?: number; maphancong?: number }>({ type: "month" });

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  const fetchHistory = useCallback(async (f: typeof filter) => {
    setLoading(true);
    try {
      const now = new Date();
      const params = new URLSearchParams({ mode: "history", limit: "100" });
      if (f.type === "month") {
        params.set("month", String(now.getMonth() + 1));
        params.set("year", String(now.getFullYear()));
      }
      if (f.mahocky) params.set("mahocky", String(f.mahocky));
      if (f.maphancong) params.set("maphancong", String(f.maphancong));

      const res = await apiFetch(`/api/sinhvien/attendance?${params}`);
      const json = await res.json();
      if (json.success) setLogs(json.data ?? []);
    } catch { setLogs([]); }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/sinhvien/attendance?mode=stats");
      const json = await res.json();
      if (json.success) setStats(json.data ?? []);
    } catch { setStats([]); }
  }, []);

  useEffect(() => {
    fetchHistory(filter);
    fetchStats();
  }, [fetchHistory, fetchStats]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
    fetchHistory(f);
  };

  const handleCheckedIn = () => {
    fetchHistory(filter);
    fetchStats();
  };

  // Tổng hợp số liệu
  const totalCoMat = stats.reduce((s, i) => s + i.coMat, 0);
  const totalMuon = stats.reduce((s, i) => s + i.muon, 0);
  const totalVangKP = stats.reduce((s, i) => s + i.vangKhongPhep, 0);
  const totalBuoi = stats.reduce((s, i) => s + i.total, 0);

  // Chuyển history → LogEntry
  const logEntries: LogEntry[] = logs.map((l) => ({
    madiemdanh: l.madiemdanh,
    day: String(l.day),
    month: String(l.month),
    subjectName: l.monhoc?.tenmon ?? "Chưa rõ",
    time: l.timeStr,
    room: l.phong ?? "",
    status: l.trangthai as TrangThai,
    phuongthuc: l.phuongthuc as any,
    notes: l.ghichu ?? undefined,
    giangvien: l.giangvien?.hoten,
  }));

  return (
    <DashboardShell pageTitle="Điểm danh">
        <div className="flex flex-col gap-8 w-full p-6 md:p-8 bg-gray-50/50 min-h-screen">
        {/* Header + Actions */}
        <AttendanceActions onFilterChange={handleFilterChange} onCheckedIn={handleCheckedIn} />

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<BookOpen size={20} className="text-blue-500" />} label="Tổng buổi" value={totalBuoi} color="border-blue-100" />
            <StatCard icon={<TrendingUp size={20} className="text-green-500" />} label="Có mặt" value={totalCoMat} color="border-green-100" />
            <StatCard icon={<Clock size={20} className="text-orange-400" />} label="Đi muộn" value={totalMuon} color="border-orange-100" />
            <StatCard icon={<XCircle size={20} className="text-red-500" />} label="Vắng KP" value={totalVangKP} color="border-red-100" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
            <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${activeTab === "history" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            Lịch sử điểm danh
            </button>
            <button onClick={() => setActiveTab("stats")} className={`px-5 py-2 rounded-xl text-sm font-semibold transition ${activeTab === "stats" ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            Thống kê môn học
            </button>
        </div>

        {/* Tab Content */}
        {activeTab === "history" && (
            <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-base font-semibold text-gray-800">
                {filter.type === "month" ? "Tháng này" : "Học kỳ này"} · {logEntries.length} bản ghi
                </h2>
            </div>
            {loading ? (
                <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-3xl animate-pulse" />
                ))}
                </div>
            ) : logEntries.length === 0 ? (
                <EmptyState
                icon={<BookOpen size={32} />}
                title="Chưa có dữ liệu điểm danh"
                description="Dữ liệu sẽ xuất hiện sau khi bạn điểm danh"
                />
            ) : (
                logEntries.map((log, i) => <AttendanceLogCard key={log.madiemdanh ?? i} log={log} />)
            )}
            </div>
        )}

        {activeTab === "stats" && (
            <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-800">Thống kê theo môn học</h2>
            {stats.length === 0 ? (
                <EmptyState
                icon={<TrendingUp size={32} />}
                title="Chưa có dữ liệu thống kê"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((s) => <SubjectStatsRow key={s.maphancong} stat={s} />)}
                </div>
            )}
            </div>
        )}
        </div>
    </DashboardShell>
  );
}
