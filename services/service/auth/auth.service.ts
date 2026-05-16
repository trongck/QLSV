import type { LoginRequest, LoginResponse, UserProfile } from "@/types";

// ─── Token Storage Keys ────────────────────────────────────────────────────────

const KEY_ACCESS = "auth_access_token";
const KEY_REFRESH = "auth_refresh_token";
const KEY_USER = "auth_user";

async function safeJson<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) return null;
  try { return (await res.json()) as T; } catch { return null; }
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Tìm giá trị trong cả hai storage — localStorage được ưu tiên. */
function readFromEither(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearBothStorages() {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(KEY_ACCESS);
    s.removeItem(KEY_REFRESH);
    s.removeItem(KEY_USER);
  });
}

// ─── Token Storage ────────────────────────────────────────────────────────────

export const tokenStorage = {

  save(accessToken: string, refreshToken: string, user: UserProfile, remember = true) {
    if (typeof window === "undefined") return;
    // Xóa cả hai storage để tránh token cũ tồn tại song song
    clearBothStorages();
    const s = remember ? localStorage : sessionStorage;
    s.setItem(KEY_ACCESS, accessToken);
    s.setItem(KEY_REFRESH, refreshToken);
    s.setItem(KEY_USER, JSON.stringify(user));
  },

  clear() {
    if (typeof window === "undefined") return;
    clearBothStorages();
  },

  getAccessToken(): string | null { return typeof window === "undefined" ? null : readFromEither(KEY_ACCESS); },
  getRefreshToken(): string | null { return typeof window === "undefined" ? null : readFromEither(KEY_REFRESH); },

  getCachedUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const raw = readFromEither(KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserProfile; } catch { return null; }
  },

  /** Token đang lưu ở localStorage (remember=true)? */
  isRemembered(): boolean {
    return typeof window !== "undefined" && !!localStorage.getItem(KEY_ACCESS);
  },
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {

  // ── Đăng nhập ──────────────────────────────────────────────────────────────

  async login(payload: LoginRequest, remember = false): Promise<LoginResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await safeJson<LoginResponse & { error?: string }>(res);
    if (!res.ok) throw new Error(data?.error ?? `Đăng nhập thất bại (${res.status}).`);
    if (!data?.accessToken) throw new Error("Phản hồi từ server không hợp lệ.");

    tokenStorage.save(data.accessToken, data.refreshToken, data.user, remember);
    return data as LoginResponse;
  },

  // ── Đăng xuất ──────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      fetch("/api/auth/logout", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {/* best-effort */ });
    }
    tokenStorage.clear();
  },

  // ── Lấy user hiện tại ─────────────────────────────────────────────────────

  async getCurrentUser(): Promise<UserProfile | null> {
    if (typeof window === "undefined") return null;

    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) return null;

    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 401) return authService.refreshAndGetUser();

    if (!res.ok) { tokenStorage.clear(); return null; }

    const data = await safeJson<{ user?: UserProfile }>(res);
    if (!data?.user) { tokenStorage.clear(); return null; }

    const refreshToken = tokenStorage.getRefreshToken()!;
    tokenStorage.save(accessToken, refreshToken, data.user, tokenStorage.isRemembered());
    return data.user;
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

    if (!res.ok) { tokenStorage.clear(); return null; }

    const tokens = await safeJson<{ accessToken: string; refreshToken: string }>(res);
    if (!tokens?.accessToken) { tokenStorage.clear(); return null; }

    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    if (!meRes.ok) { tokenStorage.clear(); return null; }

    const meData = await safeJson<{ user?: UserProfile }>(meRes);
    if (!meData?.user) { tokenStorage.clear(); return null; }

    tokenStorage.save(tokens.accessToken, tokens.refreshToken, meData.user, tokenStorage.isRemembered());
    return meData.user;
  },

  getCachedUser(): UserProfile | null {
    return tokenStorage.getCachedUser();
  },
};

// ─── apiFetch — tự gắn Bearer token & tự refresh khi 401 ─────────────────────

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    const newUser = await authService.refreshAndGetUser();
    if (!newUser) return res;
    headers.set("Authorization", `Bearer ${tokenStorage.getAccessToken()!}`);
    res = await fetch(url, { ...init, headers });
  }

  return res;
}
