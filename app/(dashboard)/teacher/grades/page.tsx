"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GradeSheet } from "@/components/teacher/GradeSheet";
import styles from "../dashboard/teacher-dashboard.module.css";

export default function TeacherGrades() {
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
    <DashboardShell pageTitle="Nhập điểm">
      <div className={styles.page}>
        <GradeSheet />
      </div>
    </DashboardShell>
  );
}
