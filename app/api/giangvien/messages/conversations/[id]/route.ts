import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
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

// GET: Lấy danh sách tin nhắn trong cuộc trò chuyện (phân trang)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getTeacherPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 30)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());

  let query = supabase
    .from("tinnhan")
    .select("matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao", { count: "exact" })
    .eq("macuoctrochuyen", convId);

  const userId = payload.mataikhoan;
  if (userId) {
    query = query.not("nguoidaxoa", "cs", `{${userId}}`);
  }

  const { data: msgs, error, count } = await query
    .order("ngaytao", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cập nhật thoigianxemcuoi của thành viên này
  const now = new Date().toISOString();
  await supabase
    .from("thanhvientrochuyen")
    .update({ thoigianxemcuoi: now })
    .eq("macuoctrochuyen", convId)
    .eq("mataikhoan", payload.mataikhoan);

  return NextResponse.json({
    data: msgs ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    me: { mataikhoan: payload.mataikhoan },
  });
}

// POST: Gửi tin nhắn mới vào cuộc trò chuyện
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getTeacherPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const body = await req.json();
  const { noidung, filedinh } = body;
  if (!noidung?.trim() && !filedinh) {
    return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");

  const { data, error } = await supabase
    .from("tinnhan")
    .insert({
      macuoctrochuyen: convId,
      mataikhoangui: payload.mataikhoan,
      noidung: noidung?.trim() ?? "",
      filedinh: filedinh ?? null,
      dachinh: false,
      ngaytao: vnNow,
      ngaycapnhat: vnNow
    })
    .select("matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Khôi phục hiển thị cuộc trò chuyện cho các thành viên khác khi có tin nhắn mới
  await supabase.from("cuoctrochuyen").update({ nguoidaxoa: [] }).eq("macuoctrochuyen", convId);

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  await supabase
    .from("thanhvientrochuyen")
    .update({ thoigianxemcuoi: now })
    .eq("macuoctrochuyen", convId)
    .eq("mataikhoan", payload.mataikhoan);

  // Ghi nhật ký audit
  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "Gửi tin nhắn",
    tentable: "tinnhan",
    makhoachinh: String(data.matinnhan),
    request: req,
  });

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE: Xóa (ẩn) cuộc hội thoại khỏi tầm nhìn của user hiện tại
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getTeacherPayload(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());
  const userId = payload.mataikhoan;

  // Lấy toàn bộ tin nhắn để đánh dấu đã xóa cho user hiện tại
  const { data: msgs } = await supabase.from("tinnhan").select("matinnhan, nguoidaxoa").eq("macuoctrochuyen", convId);

  if (msgs && msgs.length > 0) {
    const updates = msgs.map((m) => {
      const arr = m.nguoidaxoa || [];
      if (!arr.includes(userId)) {
        return supabase.from("tinnhan").update({ nguoidaxoa: [...arr, userId] }).eq("matinnhan", m.matinnhan);
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
  }

  // Thêm user vào danh sách nguoidaxoa của cuộc hội thoại
  const { data: conv } = await supabase.from("cuoctrochuyen").select("nguoidaxoa").eq("macuoctrochuyen", convId).single();
  if (conv) {
    const arr = conv.nguoidaxoa || [];
    if (!arr.includes(userId)) {
      await supabase.from("cuoctrochuyen").update({ nguoidaxoa: [...arr, userId] }).eq("macuoctrochuyen", convId);
    }
  }

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "Xóa cuộc hội thoại",
    tentable: "cuoctrochuyen",
    makhoachinh: String(convId),
    request: req,
  });

  return NextResponse.json({ success: true });
}
