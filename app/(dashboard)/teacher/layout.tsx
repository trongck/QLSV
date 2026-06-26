"use client";
import FloatingChat from "@/components/layout/FloatingChat";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingChat />
    </>
  );
}
