"use client";

import React, { useState, useEffect } from "react";
import ResultTable from "@/components/student/ResultTable";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/service/auth/auth.service";
import { Loader2, TrendingUp, Clock, BookOpen } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

interface GradeSummary {
  gpa: number | null;
  totalTinchi: number;
  totalTinchiDat: number;
  soMon: number;
  soMonDat: number;
  soMonKhongDat: number;
  tilechuyencan: number | null;
}

export default function StudentGradesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{ grades: any[]; summary: GradeSummary } | null>(null);
  const [loading, setLoading] = useState(true);

  // Route guard
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
    if (!authLoading && user && user.vaitro !== VaiTro.SinhVien) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      try {
        const res = await apiFetch("/api/student/grades");
        const json = await res.json();
        if (json.grades) {
          setData({ grades: json.grades, summary: json.summary });
        }
      } catch (err) {
        console.error("Failed to fetch grades:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <DashboardShell pageTitle="Kết quả học tập">
        <div className="flex flex-col gap-6 w-full p-6 md:p-8 bg-[#FAF7F6] min-h-screen">
        {/* 3 Thẻ thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 bg-red-50 rounded-bl-2xl text-red-400 opacity-20 group-hover:opacity-40 transition-opacity">
                <TrendingUp size={48} />
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2 z-10">
                GPA Học Kỳ
            </p>
            <h2 className="text-4xl font-black text-gray-900 z-10">
                {loading ? "..." : (data?.summary.gpa?.toFixed(2) ?? "0.00")}
            </h2>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 bg-blue-50 rounded-bl-2xl text-blue-400 opacity-20 group-hover:opacity-40 transition-opacity">
                <Clock size={48} />
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2 z-10">
                Tỉ lệ chuyên cần
            </p>
            <h2 className="text-4xl font-black text-gray-900 z-10">
                {loading ? "..." : (data?.summary.tilechuyencan ? `${data.summary.tilechuyencan}%` : "100%")}
            </h2>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-3 bg-green-50 rounded-bl-2xl text-green-400 opacity-20 group-hover:opacity-40 transition-opacity">
                <BookOpen size={48} />
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black mb-2 z-10">
                Tín chỉ tích lũy
            </p>
            <h2 className="text-4xl font-black text-gray-900 z-10">
                {loading ? "..." : (data?.summary.totalTinchiDat ?? 0)}
            </h2>
            </div>
        </div>

        {/* Bảng điểm chi tiết */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 mt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-xl font-black text-gray-900">
                        Kết quả học tập
                    </h3>
                    <p className="text-sm text-gray-400 font-medium">Học kỳ hiện tại</p>
                </div>
                {/* Có thể thêm nút In bảng điểm ở đây */}
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-20 gap-3 text-gray-400">
                    <Loader2 size={32} className="animate-spin text-red-500" />
                    <p className="text-sm font-bold">Đang tải dữ liệu điểm...</p>
                </div>
            ) : (
                /* Truyền dữ liệu thật vào ResultTable nếu component này hỗ trợ props, 
                nhưng hiện tại ResultTable đang dùng mock. 
                Tôi sẽ cập nhật ResultTable sau hoặc giả định nó hiển thị data từ context.
                */
                <ResultTable data={data?.grades} />
            )}
        </div>
        </div>
    </DashboardShell>
  );
}
