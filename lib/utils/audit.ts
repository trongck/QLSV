import { SupabaseClient } from "@supabase/supabase-js";

interface AuditLogOptions {
  supabase: SupabaseClient;
  mataikhoan: string | null;
  hanhdong: string;
  tentable?: string;
  makhoachinh?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  giatricu?: Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  giatrimoi?: Record<string, any> | null;
  request?: Request;
}

/**
 * Trả về thời gian hiện tại theo giờ Việt Nam (UTC+7), dạng chuỗi ISO không có 'Z'
 * để Postgres lưu đúng định dạng timestamp without time zone.
 */
function getNowVietnam(): string {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace("Z", "");
}

/**
 * Trích xuất địa chỉ IP thực của client từ request headers.
 * Hỗ trợ: Cloudflare, Nginx, Vercel, môi trường localhost.
 * Chuẩn hóa IPv6 loopback (::1, ::ffff:127.0.0.1) → "127.0.0.1".
 */
export function extractClientIp(request: Request): string {
  const raw =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-client-ip") ||
    "127.0.0.1";

  // Chuẩn hóa IPv6 loopback về IPv4 loopback cho dễ đọc
  if (raw === "::1" || raw === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  // Chuẩn hóa dạng IPv4-mapped IPv6: ::ffff:x.x.x.x → x.x.x.x
  if (raw.startsWith("::ffff:")) {
    return raw.slice(7);
  }

  return raw;
}

/**
 * Ghi log thao tác người dùng vào bảng nhatkyhethong.
 * Chỉ ghi: Đăng nhập, Đăng xuất, Đổi mật khẩu (mọi vai trò)
 *          và tất cả tác vụ CRUD của Admin.
 */
export async function logAuditAction(options: AuditLogOptions) {
  try {
    const hanhdongLower = options.hanhdong.toLowerCase();
    
    // Kiểm tra hành động xác thực (đăng nhập / đăng xuất / mật khẩu)
    const isAuthAction = 
      hanhdongLower.includes("đăng nhập") ||
      hanhdongLower.includes("đăng xuất") ||
      hanhdongLower.includes("mật khẩu");

    // Kiểm tra hành động Admin CRUD
    let isAdminCrud = hanhdongLower.startsWith("admin:") || hanhdongLower.startsWith("tác vụ admin:");
    if (!isAdminCrud && options.request) {
      const url = new URL(options.request.url);
      if (
        url.pathname.startsWith("/api/admin/") &&
        ["POST", "PUT", "DELETE", "PATCH"].includes(options.request.method)
      ) {
        isAdminCrud = true;
      }
    }

    // Bỏ qua nếu không thuộc danh mục cần log
    if (!isAuthAction && !isAdminCrud) {
      return;
    }

    const diachiip = options.request
      ? extractClientIp(options.request)
      : "127.0.0.1";

    const { error } = await options.supabase.from("nhatkyhethong").insert({
      mataikhoan: options.mataikhoan,
      hanhdong: options.hanhdong,
      tentable: options.tentable || null,
      makhoachinh: options.makhoachinh || null,
      giatricu: options.giatricu ?? null,
      giatrimoi: options.giatrimoi ?? null,
      diachiip,
      ngaytao: getNowVietnam(),
    });

    if (error) {
      console.error("[audit] Lỗi ghi nhật ký:", error.code, error.message, error.details);
    }
  } catch (err) {
    console.error("[audit] Lỗi ngoại lệ:", err);
  }
}
