

import { VaiTro } from "@/types";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  matkhau: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface UserProfile {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
  hoten: string;
  anhdaidien: string | null;
  maSinhVien?: string;
  maGiangVien?: string;
  maAdmin?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
  iat: number;
  exp: number;
}