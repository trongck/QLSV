"use client";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import styles from "@/components/dashboard/DashboardShell.module.css";
import { ChatAIWidget } from "@/components/student/ChatAIWidget"; // Đảm bảo file này tồn tại trong thư mục components

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className={styles.shell}>
        <DashboardSidebar />

        <main className={styles.main}>
          <div className={styles.content}>{children}</div>

          {/* PHẢI THÊM DÒNG NÀY ĐỂ NÚT CHAT HIỂN THỊ TRÊN MÀN HÌNH */}
          <ChatAIWidget />
        </main>
      </div>
    </AuthProvider>
  );
}
