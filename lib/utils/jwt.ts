import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { VaiTro } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppJwtPayload extends JWTPayload {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET chưa được cấu hình trong .env.local");
  return new TextEncoder().encode(secret);
}

const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES  ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "7d";

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signAccessToken(payload: Omit<AppJwtPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRES)
    .sign(getSecret());
}

export async function signRefreshToken(payload: Omit<AppJwtPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRES)
    .sign(getSecret());
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<AppJwtPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as AppJwtPayload;
}

// ─── Extract Bearer ───────────────────────────────────────────────────────────

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ─── Refresh token TTL (in ms) ────────────────────────────────────────────────

export function refreshTokenExpiresAt(): Date {
  // Default 7 ngày
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
