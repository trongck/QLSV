import { VaiTro } from "@/types";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  matkhau: string;
  // vaitro không cần gửi — server tự xác định từ bảng taikhoan
}

// TODO: Dùng RefreshTokenRequest làm kiểu body cho POST /api/auth/refresh
// khi muốn validate input nghiêm ngặt hơn thay vì dùng plain JSON.
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

// TODO: Dùng RefreshTokenResponse làm kiểu trả về của POST /api/auth/refresh
// sau khi thêm strong typing cho các API route handler.
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// ─── JWT Payload (dùng trong lib/utils/jwt.ts) ────────────────────────────────
// TODO: Dùng JwtPayload làm kiểu cho payload được decode từ verifyToken()
// để thống nhất với AppJwtPayload trong lib/utils/jwt.ts.

export interface JwtPayload {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
  iat: number;
  exp: number;
}