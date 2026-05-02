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
import type { UserProfile, LoginRequest } from "@/models";
import { authService } from "@/services/auth.service";
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

// ─── Hook nội bộ (chỉ dùng trong file này và hook/useAuth.ts) ────────────────

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

  // Khởi tạo: kiểm tra session đang tồn tại (dùng cached user trước, rồi verify với server)
  useEffect(() => {
    // Hiển thị cached user ngay để tránh flash màn hình trắng
    const cached = authService.getCachedUser();
    if (cached) setUser(cached);

    // Verify với server trong background
    authService
      .getCurrentUser()
      .then((profile) => setUser(profile))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ── Đăng nhập ──────────────────────────────────────────────────────────────

  const login = useCallback(async (payload: LoginRequest, remember = false) => {
    const response = await authService.login(payload);
    setUser(response.user);

    // Nếu không "Duy trì đăng nhập" → đăng ký xóa session khi tab đóng
    if (!remember) {
      const handleUnload = () => {
        authService.logout();
      };
      window.addEventListener("beforeunload", handleUnload);
      // Cleanup nếu component unmount trước khi tab đóng
      return () => window.removeEventListener("beforeunload", handleUnload);
    }

    // Redirect theo vai trò
    switch (response.user.vaitro) {
      case VaiTro.SinhVien:  router.push("/student/dashboard");  break;
      case VaiTro.GiangVien: router.push("/teacher/dashboard"); break;
      case VaiTro.Admin:     router.push("/admin/dashboard");   break;
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
