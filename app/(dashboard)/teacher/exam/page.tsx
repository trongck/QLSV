"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ExamRoom } from "@/components/teacher/ExamRoom";
import styles from "../dashboard/teacher-dashboard.module.css";

export default function TeacherExam() {
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
      <div style={{ padding: "24px", textAlign: "center", color: "#6B4F43", fontWeight: "bold" }}>
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardShell pageTitle="Thi trực tuyến">
      <div className={styles.page}>
        <ExamRoom />
      </div>
    </DashboardShell>
  );
}
