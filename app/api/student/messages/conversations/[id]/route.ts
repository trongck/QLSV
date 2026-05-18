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

// Replaced resolveIds with direct mataikhoan usage

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

  // Lấy tin nhắn — không join FK phức tạp để tránh lỗi RLS
  const userId = payload.mataikhoan;
  let query = supabase
    .from("tinnhan")
    .select("matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao", { count: "exact" })
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
  await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("mataikhoan", payload.mataikhoan);

  return NextResponse.json({
    data: msgs ?? [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
    me: { mataikhoan: payload.mataikhoan },
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

  const { data, error } = await supabase
    .from("tinnhan")
    .insert({ macuoctrochuyen: convId, mataikhoangui: payload.mataikhoan, noidung: noidung?.trim() ?? "", filedinh: filedinh ?? null, dachinh: false })
    .select("matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Khôi phục hiển thị cuộc trò chuyện cho cả 2 người khi có tin nhắn mới
  await supabase.from("cuoctrochuyen").update({ nguoidaxoa: [] }).eq("macuoctrochuyen", convId);

  // Cập nhật thoigianxemcuoi
  const now = new Date().toISOString();
  await supabase.from("thanhvientrochuyen").update({ thoigianxemcuoi: now }).eq("macuoctrochuyen", convId).eq("mataikhoan", payload.mataikhoan);

  // Lấy thông tin người gửi và người nhận để ghi log rõ ràng
  let senderName = payload.mataikhoan;
  let recipientName = "cuộc hội thoại #" + convId;

  try {
    // Lấy thông tin người gửi qua taikhoan -> sinhvien/giangvien/admin
    const { data: senderTk } = await supabase
      .from("taikhoan")
      .select("email, sinhvien(hodem, ten, masv), giangvien(hodem, ten, magv), admin(hoten, maadmin)")
      .eq("mataikhoan", payload.mataikhoan)
      .single();
      
    if (senderTk) {
      if (senderTk.sinhvien?.[0]) {
        const sv = senderTk.sinhvien[0];
        senderName = `${[sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên"} (${sv.masv})`;
      } else if (senderTk.giangvien?.[0]) {
        const gv = senderTk.giangvien[0];
        senderName = `${[gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên"} (${gv.magv})`;
      } else if (senderTk.admin?.[0]) {
        senderName = `${senderTk.admin[0].hoten} (Admin)`;
      } else {
        senderName = senderTk.email;
      }
    }

    // Lấy thành viên còn lại (người nhận)
    const { data: members } = await supabase
      .from("thanhvientrochuyen")
      .select("mataikhoan")
      .eq("macuoctrochuyen", convId);

    if (members) {
      const other = members.find((m: any) => m.mataikhoan !== payload.mataikhoan);
      if (other?.mataikhoan) {
        const { data: recvTk } = await supabase
          .from("taikhoan")
          .select("email, sinhvien(hodem, ten, masv), giangvien(hodem, ten, magv), admin(hoten, maadmin)")
          .eq("mataikhoan", other.mataikhoan)
          .single();
        if (recvTk) {
          if (recvTk.sinhvien?.[0]) {
            const sv = recvTk.sinhvien[0];
            recipientName = `${[sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên"} (${sv.masv})`;
          } else if (recvTk.giangvien?.[0]) {
            const gv = recvTk.giangvien[0];
            recipientName = `${[gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên"} (${gv.magv})`;
          } else if (recvTk.admin?.[0]) {
            recipientName = `${recvTk.admin[0].hoten} (Admin)`;
          } else {
            recipientName = recvTk.email;
          }
        }
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

  const userId = payload.mataikhoan;
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
