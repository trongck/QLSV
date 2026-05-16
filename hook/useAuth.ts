"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";
<<<<<<< HEAD
import type { LoginRequest } from "@/services/service/auth.service";
=======
import type { LoginRequest } from "@/models";
>>>>>>> baf99a6 (huy update)

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Hook công khai duy nhất cho component — wraps AuthContext + local UI state.
// Đây là nguồn dữ liệu auth duy nhất các component nên dùng.

export function useAuth() {
  const { user, loading, isAuthenticated, login, logout, logoutAll } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Xử lý login với UI state ────────────────────────────────────────────────

  const handleLogin = useCallback(
    async (payload: LoginRequest, remember = false) => {
      setSubmitting(true);
      setError(null);
      try {
        await login(payload, remember);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [login]
  );

  // ── Xử lý logout với UI state ───────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    setError(null);
    try {
      await logout();
    } catch {
      // ignore logout errors
    }
  }, [logout]);

  // ── Đăng xuất tất cả thiết bị ───────────────────────────────────────────────

  const handleLogoutAll = useCallback(async () => {
    setError(null);
    try {
      await logoutAll();
    } catch {
      // ignore
    }
  }, [logoutAll]);

  return {
    // Trạng thái
    user,
    loading,
    isAuthenticated,
    submitting,
    error,
    setError,
    // Hành động
    login: handleLogin,
    logout: handleLogout,
    logoutAll: handleLogoutAll,
  };
}
