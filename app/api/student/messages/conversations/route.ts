import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

// ─── Auth Helper ──────────────────────────────────────────────────────────────

async function requireAuth(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// User identification is now based exclusively on mataikhoan from the JWT payload

// ─── GET /api/messages/conversations ─────────────────────────────────────────
// Lấy danh sách cuộc trò chuyện của user hiện tại kèm tin nhắn cuối + số chưa đọc

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(await cookies());

  // Lấy tất cả cuộc trò chuyện mà user là thành viên
  const { data: memberRows, error: memberErr } = await supabase
    .from("thanhvientrochuyen")
    .select("macuoctrochuyen, thoigianxemcuoi")
    .eq("mataikhoan", payload.mataikhoan);
  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }
  if (!memberRows || memberRows.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const conversationIds = memberRows.map((r) => r.macuoctrochuyen);
  const viewTimeMap: Record<number, string | null> = {};
  memberRows.forEach((r) => { viewTimeMap[r.macuoctrochuyen] = r.thoigianxemcuoi; });

  // Lấy thông tin cuộc trò chuyện + các thành viên + tin nhắn cuối
  const { data: conversations, error: convErr } = await supabase
    .from("cuoctrochuyen")
    .select(`
      macuoctrochuyen,
      tieude,
      loai,
      ngaytao,
      nguoidaxoa,
      thanhvientrochuyen (
        mataikhoan,
        vaitro,
        thoigianxemcuoi,
        taikhoan:mataikhoan ( mataikhoan, email, vaitro )
      ),
      tinnhan (
        matinnhan,
        noidung,
        mataikhoangui,
        ngaytao,
        nguoidaxoa
      )
    `)
    .in("macuoctrochuyen", conversationIds)
    .order("ngaytao", { referencedTable: "tinnhan", ascending: false });

  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 });
  }

  // Xử lý: lấy tin nhắn cuối + tính số chưa đọc
  const result = (conversations ?? [])
    .filter((conv: any) => !(conv.nguoidaxoa || []).includes(payload.mataikhoan))
    .map((conv: any) => {
    let messages: any[] = conv.tinnhan ?? [];
    messages = messages.filter((m: any) => !m.nguoidaxoa?.includes(payload.mataikhoan));

    // Sắp xếp tin nhắn theo thời gian mới nhất
    const sorted = [...messages].sort(
      (a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime()
    );
    const lastMsg = sorted[0] ?? null;

    const viewTime = viewTimeMap[conv.macuoctrochuyen];
    const unread = viewTime
      ? messages.filter((m) => new Date(m.ngaytao) > new Date(viewTime)).length
      : messages.length;

    const members: any[] = conv.thanhvientrochuyen ?? [];
    const otherMembers = members.filter((m) => m.mataikhoan !== payload.mataikhoan);

    return {
      macuoctrochuyen: conv.macuoctrochuyen,
      tieude: conv.tieude,
      loai: conv.loai,
      ngaytao: conv.ngaytao,
      members,
      otherMembers,
      lastMsg,
      unread,
    };
  });

  // Sắp xếp theo tin nhắn mới nhất
  result.sort((a, b) => {
    const ta = a.lastMsg ? new Date(a.lastMsg.ngaytao).getTime() : new Date(a.ngaytao).getTime();
    const tb = b.lastMsg ? new Date(b.lastMsg.ngaytao).getTime() : new Date(b.ngaytao).getTime();
    return tb - ta;
  });

  return NextResponse.json({ data: result });
}

// ─── POST /api/messages/conversations ────────────────────────────────────────
// Tạo cuộc trò chuyện 1-1 mới (hoặc trả về cuộc trò chuyện đã tồn tại)

export async function POST(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { otherMataikhoan } = body;

  if (!otherMataikhoan) {
    return NextResponse.json({ error: "Cần cung cấp otherMataikhoan của người nhận." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  // Kiểm tra cuộc trò chuyện 1-1 đã tồn tại chưa
  const { data: myConvs } = await supabase
    .from("thanhvientrochuyen")
    .select("macuoctrochuyen")
    .eq("mataikhoan", payload.mataikhoan);
  const myConvIds = (myConvs ?? []).map((r) => r.macuoctrochuyen);

  if (myConvIds.length > 0) {
    // Resolve mataikhoan của người kia để tìm conversation chung
    const otherMataikhoanCheck = otherMataikhoan;

    if (otherMataikhoanCheck) {
      const { data: sharedConvs } = await supabase
        .from("thanhvientrochuyen")
        .select("macuoctrochuyen")
        .eq("mataikhoan", otherMataikhoanCheck)
        .in("macuoctrochuyen", myConvIds);

      if (sharedConvs && sharedConvs.length > 0) {
        const { data: existingConv } = await supabase
          .from("cuoctrochuyen")
          .select("macuoctrochuyen, tieude, loai, ngaytao, nguoidaxoa")
          .in("macuoctrochuyen", sharedConvs.map((r) => r.macuoctrochuyen))
          .eq("loai", "CaNhan")
          .single();

        if (existingConv) {
          const currentArr = existingConv.nguoidaxoa || [];
          if (currentArr.includes(payload.mataikhoan)) {
            const newArr = currentArr.filter((id: string) => id !== payload.mataikhoan);
            await supabase.from("cuoctrochuyen").update({ nguoidaxoa: newArr }).eq("macuoctrochuyen", existingConv.macuoctrochuyen);
          }
          return NextResponse.json({ data: existingConv, existed: true }, { status: 200 });
        }
      }
    }
  }

  // Tạo cuộc trò chuyện mới
  const { data: newConv, error: convErr } = await supabase
    .from("cuoctrochuyen")
    .insert({ loai: "CaNhan", tieude: null })
    .select("macuoctrochuyen, tieude, loai, ngaytao")
    .single();

  if (convErr || !newConv) {
    return NextResponse.json({ error: convErr?.message ?? "Không thể tạo cuộc trò chuyện." }, { status: 500 });
  }

  const membersToInsert: any[] = [
    { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: payload.mataikhoan, vaitro: "member" },
    { macuoctrochuyen: newConv.macuoctrochuyen, mataikhoan: otherMataikhoan, vaitro: "member" },
  ];

  const { error: memberErr } = await supabase.from("thanhvientrochuyen").insert(membersToInsert);
  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "INSERT",
    tentable: "cuoctrochuyen",
    makhoachinh: String(newConv.macuoctrochuyen),
    giatrimoi: newConv,
    request,
  });

  return NextResponse.json({ data: newConv, existed: false }, { status: 201 });
}
