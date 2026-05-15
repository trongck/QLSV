import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

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

/**
 * Lấy masv hoặc magv của user hiện tại từ JWT payload.
 * Trả về { masv, magv } — một trong hai sẽ null.
 */
async function resolveUserIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  mataikhoan: string,
  vaitro: VaiTro
): Promise<{ masv: string | null; magv: string | null }> {
  if (vaitro === VaiTro.SinhVien) {
    const { data } = await supabase
      .from("sinhvien")
      .select("masv")
      .eq("mataikhoan", mataikhoan)
      .single();
    return { masv: data?.masv ?? null, magv: null };
  }
  if (vaitro === VaiTro.GiangVien) {
    const { data } = await supabase
      .from("giangvien")
      .select("magv")
      .eq("mataikhoan", mataikhoan)
      .single();
    return { masv: null, magv: data?.magv ?? null };
  }
  return { masv: null, magv: null };
}

// ─── GET /api/messages/conversations ─────────────────────────────────────────
// Lấy danh sách cuộc trò chuyện của user hiện tại kèm tin nhắn cuối + số chưa đọc

export async function GET(request: Request) {
  const payload = await requireAuth(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveUserIds(supabase, payload.mataikhoan, payload.vaitro);

  if (!masv && !magv) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
  }

  // Lấy tất cả cuộc trò chuyện mà user là thành viên
  const memberFilter = masv
    ? supabase.from("thanhvientrochuyen").select("macuoctrochuyen, thoigianxemcuoi").eq("masv", masv)
    : supabase.from("thanhvientrochuyen").select("macuoctrochuyen, thoigianxemcuoi").eq("magv", magv!);

  const { data: memberRows, error: memberErr } = await memberFilter;
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
      thanhvientrochuyen (
        masv,
        magv,
        vaitro,
        thoigianxemcuoi,
        sinhvien:masv ( masv, hoten, anhdaidien ),
        giangvien:magv ( magv, hoten, anhdaidien )
      ),
      tinnhan (
        matinnhan,
        noidung,
        masvgui,
        magvgui,
        ngaytao
      )
    `)
    .in("macuoctrochuyen", conversationIds)
    .order("ngaytao", { referencedTable: "tinnhan", ascending: false });

  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 });
  }

  // Xử lý: lấy tin nhắn cuối + tính số chưa đọc
  const result = (conversations ?? []).map((conv) => {
    const messages: any[] = conv.tinnhan ?? [];
    // Sắp xếp tin nhắn theo thời gian mới nhất
    const sorted = [...messages].sort(
      (a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime()
    );
    const lastMsg = sorted[0] ?? null;

    const viewTime = viewTimeMap[conv.macuoctrochuyen];
    const unread = viewTime
      ? messages.filter((m) => new Date(m.ngaytao) > new Date(viewTime)).length
      : messages.length;

    // Lấy thành viên khác (không phải chính mình) để hiển thị tên/avatar cuộc trò chuyện 1-1
    const members: any[] = conv.thanhvientrochuyen ?? [];
    const otherMembers = members.filter((m) => {
      if (masv) return m.masv !== masv;
      if (magv) return m.magv !== magv;
      return true;
    });

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
  const { otherMasv, otherMagv } = body;

  if (!otherMasv && !otherMagv) {
    return NextResponse.json({ error: "Cần cung cấp masv hoặc magv của người nhận." }, { status: 400 });
  }

  const supabase = createClient(await cookies());
  const { masv, magv } = await resolveUserIds(supabase, payload.mataikhoan, payload.vaitro);

  if (!masv && !magv) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ người dùng." }, { status: 404 });
  }

  // Kiểm tra cuộc trò chuyện 1-1 đã tồn tại chưa
  // Lấy tất cả conversation mà mình tham gia
  const myFilter = masv
    ? supabase.from("thanhvientrochuyen").select("macuoctrochuyen").eq("masv", masv)
    : supabase.from("thanhvientrochuyen").select("macuoctrochuyen").eq("magv", magv!);
  const { data: myConvs } = await myFilter;
  const myConvIds = (myConvs ?? []).map((r) => r.macuoctrochuyen);

  if (myConvIds.length > 0) {
    // Tìm conversation mà người kia cũng tham gia
    const otherFilter = otherMasv
      ? supabase.from("thanhvientrochuyen").select("macuoctrochuyen").eq("masv", otherMasv).in("macuoctrochuyen", myConvIds)
      : supabase.from("thanhvientrochuyen").select("macuoctrochuyen").eq("magv", otherMagv).in("macuoctrochuyen", myConvIds);
    const { data: sharedConvs } = await otherFilter;

    if (sharedConvs && sharedConvs.length > 0) {
      // Ưu tiên cuộc trò chuyện loại Rieng
      const { data: existingConv } = await supabase
        .from("cuoctrochuyen")
        .select("macuoctrochuyen, tieude, loai, ngaytao")
        .in("macuoctrochuyen", sharedConvs.map((r) => r.macuoctrochuyen))
        .eq("loai", "Rieng")
        .single();

      if (existingConv) {
        return NextResponse.json({ data: existingConv, existed: true }, { status: 200 });
      }
    }
  }

  // Tạo cuộc trò chuyện mới
  const { data: newConv, error: convErr } = await supabase
    .from("cuoctrochuyen")
    .insert({ loai: "Rieng", tieude: null })
    .select("macuoctrochuyen, tieude, loai, ngaytao")
    .single();

  if (convErr || !newConv) {
    return NextResponse.json({ error: convErr?.message ?? "Không thể tạo cuộc trò chuyện." }, { status: 500 });
  }

  // Thêm 2 thành viên
  const membersToInsert: any[] = [
    {
      macuoctrochuyen: newConv.macuoctrochuyen,
      masv: masv ?? null,
      magv: magv ?? null,
      vaitro: "member",
    },
    {
      macuoctrochuyen: newConv.macuoctrochuyen,
      masv: otherMasv ?? null,
      magv: otherMagv ?? null,
      vaitro: "member",
    },
  ];

  const { error: memberErr } = await supabase.from("thanhvientrochuyen").insert(membersToInsert);
  if (memberErr) {
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json({ data: newConv, existed: false }, { status: 201 });
}
