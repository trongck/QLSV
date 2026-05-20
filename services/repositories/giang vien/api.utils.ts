/**
 * services/repositories/api.utils.ts
 * Shared helper để parse JSON từ fetch response — dùng chung cho mọi repository.
 */
import { apiFetch } from "@/services/service/auth/auth.service";
export { apiFetch };

export async function apiJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    const msg = ct.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { error?: string }).error
      : undefined;
    throw new Error(msg ?? `Lỗi ${res.status}`);
  }
  return res.json() as Promise<T>;
}
