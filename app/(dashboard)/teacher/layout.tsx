"use client";
import { AuthProvider } from "@/context/AuthContext";
import FloatingChat from "@/components/layout/FloatingChat";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
      <FloatingChat />
    </AuthProvider>
  );
}

