"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserProfile, LoginRequest } from "@/services/service/auth.service";
import { authService } from "@/services/service/auth.service";
import { VaiTro } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

// ─── Context (internal — không export trực tiếp cho component) ───────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext phải dùng bên trong <AuthProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Khởi tạo: hiển thị cached user ngay, rồi verify với server trong background
  useEffect(() => {
    const cached = authService.getCachedUser();
    if (cached) setUser(cached);

    authService
      .getCurrentUser()
      .then((profile) => setUser(profile))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);



  const login = useCallback(async (payload: LoginRequest, remember = false) => {
    const response = await authService.login(payload, remember);
    setUser(response.user);

    // Redirect theo vai trò — chạy bất kể remember hay không
    switch (response.user.vaitro) {
      case VaiTro.SinhVien: router.push("/student/dashboard"); break;
      case VaiTro.GiangVien: router.push("/teacher/dashboard"); break;
      case VaiTro.Admin: router.push("/admin/dashboard"); break;
    }
  }, [router]);

  // ── Đăng xuất ──────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  // ── Đăng xuất tất cả thiết bị ──────────────────────────────────────────────

  const logoutAll = useCallback(async () => {
    if (!user) return;
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mataikhoan: user.mataikhoan }),
    });
    await authService.logout();
    setUser(null);
    router.push("/login");
  }, [router, user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, logout, logoutAll }}
    >
      {children}
    </AuthContext.Provider>
  );
}