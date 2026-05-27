"use client";

import React, { useEffect, ReactNode } from "react";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { VaiTro } from "@/types";
import { Loader2 } from "lucide-react";
import { ChatAIWidget } from "@/components/student/ChatAIWidget";

function StudentGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.vaitro !== VaiTro.SinhVien) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.vaitro !== VaiTro.SinhVien) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAF7F6] z-[9999]">
        <Loader2 className="animate-spin text-red-500 mb-4" size={40} />
        <p className="text-gray-400 font-bold tracking-widest uppercase text-xs">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <ChatAIWidget />
    </>
  );
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <StudentGuard>{children}</StudentGuard>
  );
}
