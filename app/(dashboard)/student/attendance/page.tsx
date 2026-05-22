"use client";

import { useState, useEffect, useCallback } from "react";
import AttendanceActions from "@/components/student/AttendanceActions";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import AttendanceLogCard, { type LogEntry, type TrangThai } from "@/components/student/AttendanceLogCard";
import { BookOpen, TrendingUp, XCircle, Clock } from "lucide-react";
import { StatCard, EmptyState } from "@/components/student/StudentUI";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useStudentAttendance } from "@/hooks/sinhvien/useStudentAttendance";
import { SubjectStatsRow } from "@/components/student/SubjectStatsRow";

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const {
    history,
    subjectStats,
    loading,
    fetchHistory,
    fetchStats,
  } = useStudentAttendance();

  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [filter, setFilter] = useState<{ type: "month" | "semester"; mahocky?: number; maphancong?: number }>({ type: "month" });

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  const loadFilteredHistory = useCallback((f: typeof filter) => {
    const now = new Date();
    const opts: any = {};
    if (f.type === "month") {
      opts.month = now.getMonth() + 1;
      opts.year = now.getFullYear();
    }
    if (f.mahocky) opts.mahocky = f.mahocky;
    if (f.maphancong) opts.maphancong = f.maphancong;
    fetchHistory(opts);
  }, [fetchHistory]);

  useEffect(() => {
    loadFilteredHistory(filter);
    fetchStats();
  }, [loadFilteredHistory, fetchStats, filter]);

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f);
  };

  const handleCheckedIn = () => {
    loadFilteredHistory(filter);
    fetchStats();
  };

  // Tổng hợp số liệu
  const totalCoMat = subjectStats.reduce((s, i) => s + i.coMat, 0);
  const totalMuon = subjectStats.reduce((s, i) => s + i.muon, 0);
  const totalVangKP = subjectStats.reduce((s, i) => s + i.vangKhongPhep, 0);
  const totalBuoi = subjectStats.reduce((s, i) => s + i.total, 0);

  // Chuyển history → LogEntry
  const logEntries: LogEntry[] = history.map((l) => ({
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
            {subjectStats.length === 0 ? (
              <EmptyState
                icon={<TrendingUp size={32} />}
                title="Chưa có dữ liệu thống kê"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectStats.map((s) => <SubjectStatsRow key={s.maphancong} stat={s} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
