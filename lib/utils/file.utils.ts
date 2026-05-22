/**
 * lib/utils/file.utils.ts
 * Các hàm tiện ích xử lý file / URL storage dùng chung trong phân hệ sinh viên.
 */

const KNOWN_BUCKETS = ["attachments", "assignments", "tasks", "documents", "tailieu"];

/**
 * Chuyển đổi path file (từ DB) thành URL công khai có thể truy cập.
 * Hỗ trợ: URL đầy đủ, đường dẫn /uploads/, và path trong Supabase Storage.
 */
export function resolveFileUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";

  // Đã là URL đầy đủ
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // Đường dẫn /uploads/ nội bộ
  if (pathOrUrl.startsWith("/uploads/") || pathOrUrl.startsWith("uploads/")) {
    return pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  }

  // Path trong Supabase Storage
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mjyxgwodxvntotsnuads.supabase.co";
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  const parts = cleanPath.split("/");

  if (parts.length > 1) {
    const bucket = parts[0];
    const pathInBucket = parts.slice(1).join("/");
    if (KNOWN_BUCKETS.includes(bucket.toLowerCase())) {
      return `${supabaseUrl}/storage/v1/object/public/${bucket}/${pathInBucket}`;
    }
  }

  return `${supabaseUrl}/storage/v1/object/public/attachments/${cleanPath}`;
}

/** Lấy tên file từ URL hoặc path (decode URI) */
export function extractFileName(pathOrUrl: string | null | undefined, fallback = "file"): string {
  if (!pathOrUrl) return fallback;
  // Hỗ trợ ?name= param
  const nameParam = pathOrUrl.split("?name=").pop();
  if (nameParam && nameParam !== pathOrUrl) {
    return decodeURIComponent(nameParam);
  }
  return decodeURIComponent(pathOrUrl.split("/").pop()?.split("?").shift() ?? fallback);
}

/** Kiểm tra loại file theo đuôi mở rộng */
export function getFileType(url: string): "pdf" | "image" | "doc" | "other" {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".pdf")) return "pdf";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp"].some((e) => lower.endsWith(e))) return "image";
  if ([".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"].some((e) => lower.endsWith(e))) return "doc";
  return "other";
}
