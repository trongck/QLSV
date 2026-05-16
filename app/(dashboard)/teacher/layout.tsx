"use client";
import { AuthProvider } from "@/context/AuthContext";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
