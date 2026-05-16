import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function requireAuth(req: Request) {
  const token = extractBearer(req.headers.get("authorization"));
  if (!token) return null;
  try { return await verifyToken(token); } catch { return null; }
}

async function resolveIds(supabase: any, mataikhoan: string, vaitro: VaiTro) {
  if (vaitro === VaiTro.SinhVien) {
    const { data } = await supabase.from("sinhvien").select("masv").eq("mataikhoan", mataikhoan).single();
    return { masv: data?.masv ?? null, magv: null };
  }
  if (vaitro === VaiTro.GiangVien) {
    const { data } = await supabase.from("giangvien").select("magv").eq("mataikhoan", mataikhoan).single();
    return { masv: null, magv: data?.magv ?? null };
  }
  return { masv: null, magv: null };
}

// GET: lấy tin nhắn
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 30)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  // Lấy tin nhắn — không join FK phức tạp để tránh lỗi RLS
  const userId = masv ?? magv;
  let query = supabase
    .from("tinnhan")
    .select("matinnhan, macuoctrochuyen, masvgui, magvgui, noidung, filedinh, dachinh, ngaytao", { count: "exact" })
    .eq("macuoctrochuyen", convId);

  if (userId) {
    query = query.not("nguoidaxoa", "cs", `{${userId}}`);
  }

  const { data: msgs, error, count } = await query
    .order("ngaytao", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  if (masv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("masv", masv);
  else if (magv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("magv", magv);

  return NextResponse.json({
    data: msgs ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    me: { masv, magv },
  });
}

// POST: gửi tin nhắn
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const body = await req.json();
  const { noidung, filedinh } = body;
  if (!noidung?.trim() && !filedinh) return NextResponse.json({ error: "Nội dung không được trống" }, { status: 400 });

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  const { data, error } = await supabase
    .from("tinnhan")
    .insert({ macuoctrochuyen: convId, masvgui: masv, magvgui: magv, noidung: noidung?.trim() ?? "", filedinh: filedinh ?? null, dachinh: false })
    .select("matinnhan, macuoctrochuyen, masvgui, magvgui, noidung, filedinh, dachinh, ngaytao")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Khôi phục hiển thị cuộc trò chuyện cho cả 2 người khi có tin nhắn mới
  await supabase.from("cuoctrochuyen").update({ nguoidaxoa: [] }).eq("macuoctrochuyen", convId);

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  if (masv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("masv", masv);
  else if (magv) await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("magv", magv);

  // Lấy thông tin người gửi và người nhận để ghi log rõ ràng
  let senderName = payload.mataikhoan;
  let recipientName = "cuộc hội thoại #" + convId;

  try {
    // Lấy tên người gửi
    if (masv) {
      const { data: svSender } = await supabase.from("sinhvien").select("hoten").eq("masv", masv).single();
      if (svSender) senderName = `${svSender.hoten} (${masv})`;
    } else if (magv) {
      const { data: gvSender } = await supabase.from("giangvien").select("hoten").eq("magv", magv).single();
      if (gvSender) senderName = `${gvSender.hoten} (${magv})`;
    }

    // Lấy thành viên còn lại (người nhận)
    const { data: members } = await supabase
      .from("thanhvientrochuyen")
      .select("masv, magv")
      .eq("macuoctrochuyen", convId);

    if (members) {
      const other = members.find((m) => m.masv !== masv || m.magv !== magv);
      if (other?.masv) {
        const { data: svRecv } = await supabase.from("sinhvien").select("hoten").eq("masv", other.masv).single();
        if (svRecv) recipientName = `${svRecv.hoten} (${other.masv})`;
      } else if (other?.magv) {
        const { data: gvRecv } = await supabase.from("giangvien").select("hoten").eq("magv", other.magv).single();
        if (gvRecv) recipientName = `${gvRecv.hoten} (${other.magv})`;
      }
    }
  } catch (_) { /* fallback to defaults */ }

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: `Gửi tin nhắn: ${senderName} ⇒ ${recipientName}`,
    tentable: "tinnhan",
    makhoachinh: String(data.matinnhan),
    request: req,
  });

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE: xóa hội thoại
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convId = Number(id);
  if (isNaN(convId)) return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveIds(supabase, payload.mataikhoan, payload.vaitro);

  const userId = masv ?? magv;
  if (!userId) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  // Lấy danh sách tin nhắn hiện tại
  const { data: msgs } = await supabase.from("tinnhan").select("matinnhan, nguoidaxoa").eq("macuoctrochuyen", convId);
  
  if (msgs && msgs.length > 0) {
    // Cập nhật từng tin nhắn
    const updates = msgs.map(m => {
      const arr = m.nguoidaxoa || [];
      if (!arr.includes(userId)) {
        return supabase.from("tinnhan").update({ nguoidaxoa: [...arr, userId] }).eq("matinnhan", m.matinnhan);
      }
      return Promise.resolve();
    });
    await Promise.all(updates);
  }

  // Cập nhật cuộc trò chuyện để ẩn nó khỏi danh sách của user
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
    hanhdong: "Xóa hội thoại (ẩn với user)",
    tentable: "tinnhan",
    makhoachinh: String(convId),
    request: req,
  });

  return NextResponse.json({ success: true });
}
