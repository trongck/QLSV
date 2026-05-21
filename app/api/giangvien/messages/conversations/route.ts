import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

// Auth helper
async function getTeacherPayload(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token) as any;
    if (payload.vaitro !== VaiTro.GiangVien) return null;
    return payload;
  } catch {
    return null;
  }
}

// GET: Lấy danh sách cuộc trò chuyện của giảng viên
export async function GET(request: Request) {
  const payload = await getTeacherPayload(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(await cookies());

  // Lấy các cuộc hội thoại mà user là thành viên
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
  memberRows.forEach((r) => {
    viewTimeMap[r.macuoctrochuyen] = r.thoigianxemcuoi;
  });

  // Lấy cuộc hội thoại + thành viên + tin nhắn cuối
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
        taikhoan:mataikhoan (
          mataikhoan,
          email,
          vaitro,
          sinhvien (masv, hodem, ten, anhdaidien, emailtruong),
          giangvien (magv, hodem, ten, anhdaidien, emailtruong),
          admin (maadmin, hoten)
        )
      ),
      tinnhan (
        matinnhan,
        noidung,
        mataikhoangui,
        ngaytao,
        nguoidaxoa
      )
    `)
    .in("macuoctrochuyen", conversationIds);

  if (convErr) {
    return NextResponse.json({ error: convErr.message }, { status: 500 });
  }

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

      // Map profiles for members
      const members = (conv.thanhvientrochuyen ?? []).map((m: any) => {
        const role = m.taikhoan?.vaitro;
        let displayName = m.mataikhoan;
        let avatar = null;
        let secondaryId = "";

        const rawSv = m.taikhoan?.sinhvien;
        const sv = Array.isArray(rawSv) ? rawSv[0] : rawSv;

        const rawGv = m.taikhoan?.giangvien;
        const gv = Array.isArray(rawGv) ? rawGv[0] : rawGv;

        const rawAdm = m.taikhoan?.admin;
        const adm = Array.isArray(rawAdm) ? rawAdm[0] : rawAdm;

        if (role === VaiTro.SinhVien && sv) {
          displayName = `${sv.hodem || ""} ${sv.ten || ""}`.trim() || "Sinh viên";
          avatar = sv.anhdaidien;
          secondaryId = sv.masv;
        } else if (role === VaiTro.GiangVien && gv) {
          displayName = `${gv.hodem || ""} ${gv.ten || ""}`.trim() || "Giảng viên";
          avatar = gv.anhdaidien;
          secondaryId = gv.magv;
        } else if (role === VaiTro.Admin && adm) {
          displayName = adm.hoten || "Quản trị viên";
          secondaryId = adm.maadmin;
        }

        return {
          mataikhoan: m.mataikhoan,
          vaitro: m.vaitro,
          thoigianxemcuoi: m.thoigianxemcuoi,
          taikhoan: {
            email: m.taikhoan?.email,
            vaitro: m.taikhoan?.vaitro,
            hoten: displayName,
            anhdaidien: avatar,
            id_phu: secondaryId,
          }
        };
      });

      const otherMembers = members.filter((m: any) => m.mataikhoan !== payload.mataikhoan);

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

  // Sắp xếp theo tin nhắn mới nhất hoặc ngày tạo
  result.sort((a, b) => {
    const ta = a.lastMsg ? new Date(a.lastMsg.ngaytao).getTime() : new Date(a.ngaytao).getTime();
    const tb = b.lastMsg ? new Date(b.lastMsg.ngaytao).getTime() : new Date(b.ngaytao).getTime();
    return tb - ta;
  });

  return NextResponse.json({ data: result });
}

// POST: Tạo cuộc trò chuyện 1-1 mới (hoặc lấy cuộc trò chuyện cũ)
export async function POST(request: Request) {
  const payload = await getTeacherPayload(request);
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
    const { data: sharedConvs } = await supabase
      .from("thanhvientrochuyen")
      .select("macuoctrochuyen")
      .eq("mataikhoan", otherMataikhoan)
      .in("macuoctrochuyen", myConvIds);

    if (sharedConvs && sharedConvs.length > 0) {
      const { data: existingConv } = await supabase
        .from("cuoctrochuyen")
        .select("macuoctrochuyen, tieude, loai, ngaytao, nguoidaxoa")
        .in("macuoctrochuyen", sharedConvs.map((r) => r.macuoctrochuyen))
        .eq("loai", "CaNhan")
        .maybeSingle();

      if (existingConv) {
        // Nếu đã từng xóa, khôi phục lại hiển thị
        const currentArr = existingConv.nguoidaxoa || [];
        if (currentArr.includes(payload.mataikhoan)) {
          const newArr = currentArr.filter((id: string) => id !== payload.mataikhoan);
          await supabase.from("cuoctrochuyen").update({ nguoidaxoa: newArr }).eq("macuoctrochuyen", existingConv.macuoctrochuyen);
        }
        return NextResponse.json({ data: existingConv, existed: true });
      }
    }
  }

  // Tạo cuộc trò chuyện mới
  const { data: newConv, error: convErr } = await supabase
    .from("cuoctrochuyen")
    .insert({ loai: "CaNhan", tieude: null, nguoidaxoa: [] })
    .select("macuoctrochuyen, tieude, loai, ngaytao")
    .single();

  if (convErr || !newConv) {
    return NextResponse.json({ error: convErr?.message ?? "Không thể tạo cuộc trò chuyện." }, { status: 500 });
  }

  const membersToInsert = [
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
    hanhdong: "Tạo hội thoại mới",
    tentable: "cuoctrochuyen",
    makhoachinh: String(newConv.macuoctrochuyen),
    giatrimoi: newConv,
    request,
  });

  return NextResponse.json({ data: newConv, existed: false }, { status: 201 });
}
