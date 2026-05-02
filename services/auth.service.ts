import type { LoginRequest, LoginResponse, UserProfile } from "@/models";

// ─── Token Storage Keys ────────────────────────────────────────────────────────

const KEY_ACCESS  = "auth_access_token";
const KEY_REFRESH = "auth_refresh_token";
const KEY_USER    = "auth_user";

// ─── Token Helpers (client-side only) ─────────────────────────────────────────

export const tokenStorage = {
  save(accessToken: string, refreshToken: string, user: UserProfile) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY_ACCESS, accessToken);
    localStorage.setItem(KEY_REFRESH, refreshToken);
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  },

  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
  },

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY_ACCESS);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY_REFRESH);
  },

  getCachedUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserProfile; } catch { return null; }
  },
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {

  // ── Đăng nhập ──────────────────────────────────────────────────────────────

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Đăng nhập thất bại.");

    // Lưu token + user vào localStorage
    tokenStorage.save(data.accessToken, data.refreshToken, data.user);
    return data as LoginResponse;
  },

  // ── Đăng xuất ──────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();

    // Xóa phiên trên server (best-effort)
    if (refreshToken) {
      fetch("/api/auth/logout", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {/* ignore */});
    }

    tokenStorage.clear();
  },

  // ── Lấy user hiện tại (gọi API với Bearer token) ──────────────────────────

  async getCurrentUser(): Promise<UserProfile | null> {
    if (typeof window === "undefined") return null;

    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) return null;

    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Token hết hạn → thử refresh
    if (res.status === 401) {
      return await authService.refreshAndGetUser();
    }

    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }

    const data = await res.json();
    if (!data.user) { tokenStorage.clear(); return null; }

    // Cập nhật cache
    const refreshToken = tokenStorage.getRefreshToken()!;
    tokenStorage.save(accessToken, refreshToken, data.user);
    return data.user as UserProfile;
  },

  // ── Refresh token ──────────────────────────────────────────────────────────

  async refreshAndGetUser(): Promise<UserProfile | null> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) { tokenStorage.clear(); return null; }

    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }

    const data = await res.json();
    // Gọi lại /me với access token mới
    const meRes = await fetch("/api/auth/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });

    if (!meRes.ok) { tokenStorage.clear(); return null; }

    const meData = await meRes.json();
    if (!meData.user) { tokenStorage.clear(); return null; }

    tokenStorage.save(data.accessToken, data.refreshToken, meData.user);
    return meData.user as UserProfile;
  },

  // ── Lấy user từ cache (đồng bộ, không gọi network) ──────────────────────

  getCachedUser(): UserProfile | null {
    return tokenStorage.getCachedUser();
  },
};

// ─── Fetch helper gắn Bearer token tự động ────────────────────────────────────
// Dùng thay fetch() trong các service khác để tự động refresh khi 401

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const accessToken = tokenStorage.getAccessToken();
  const headers = new Headers(init?.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let res = await fetch(url, { ...init, headers });

  // Tự động refresh nếu 401
  if (res.status === 401) {
    const newUser = await authService.refreshAndGetUser();
    if (!newUser) return res; // không thể refresh → trả 401 để caller xử lý

    const newToken = tokenStorage.getAccessToken()!;
    headers.set("Authorization", `Bearer ${newToken}`);
    res = await fetch(url, { ...init, headers });
  }

  return res;
}
