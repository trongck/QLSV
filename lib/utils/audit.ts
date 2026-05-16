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
 * Trả về thời gian hiện tại theo giờ Việt Nam (UTC+7)
 */
function getNowVietnam(): string {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().replace("Z", "+07:00");
}

/**
 * Ghi log thao tác người dùng vào bảng nhatkyhethong.
 * Yêu cầu: bảng nhatkyhethong phải có RLS policy cho phép INSERT
 * hoặc RLS phải được tắt.
 */
export async function logAuditAction(options: AuditLogOptions) {
  try {
    let diachiip = "127.0.0.1";
    if (options.request) {
      diachiip =
        options.request.headers.get("x-forwarded-for")?.split(",")[0] ||
        options.request.headers.get("x-real-ip") ||
        "127.0.0.1";
    }

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
