import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function getTeacherPayload(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) return null;
    return payload;
  } catch {
    return null;
  }
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
];

export async function POST(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Dữ liệu form không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });

  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File vượt quá giới hạn 10MB" }, { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  const ALLOWED_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "zip", "rar", "7z"];
  const isAllowed = ALLOWED_TYPES.includes(file.type) || (ext && ALLOWED_EXTS.includes(ext));

  if (!isAllowed)
    return NextResponse.json({ error: "Loại file không được hỗ trợ" }, { status: 415 });

  const supabase = await getSupabaseClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `messages/${payload.mataikhoan}/${Date.now()}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("attachments")
    .getPublicUrl(filePath);

  const fileUrl = urlData.publicUrl;

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "Tải lên tệp đính kèm tin nhắn (Supabase)",
    tentable: "tinnhan-files",
    makhoachinh: fileUrl,
    request: req,
  });

  return NextResponse.json({ url: fileUrl, name: file.name, type: file.type, size: file.size });
}
