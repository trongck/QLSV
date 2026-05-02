"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "@/context/AuthContext";
import type { LoginRequest } from "@/models";

// ─── useAuth ──────────────────────────────────────────────────────────────────
// Thin hook gói AuthContext + local loading/error state cho form login

export function useAuth() {
  const { user, loading, login, logout, isAuthenticated } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (payload: LoginRequest) => {
      setSubmitting(true);
      setError(null);
      try {
        await login(payload);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
        // Map Supabase error message → tiếng Việt thân thiện
        if (
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("wrong") ||
          message.toLowerCase().includes("credentials")
        ) {
          setError("Sai email/mã hoặc mật khẩu. Vui lòng thử lại.");
        } else {
          setError(message);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [login]
  );

  return {
    user,
    loading,
    isAuthenticated,
    submitting,
    error,
    setError,
    login: handleLogin,
    logout,
  };
}
