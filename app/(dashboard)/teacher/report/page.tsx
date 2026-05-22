"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReportView } from "@/components/teacher/ReportView";

export default function TeacherReport() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="p-6 text-center text-fg-muted font-bold">
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardShell pageTitle="Báo cáo &amp; Thống kê">
      <div className="flex flex-col gap-5">
        <ReportView />
      </div>
    </DashboardShell>
  );
}
