import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

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

// GET /api/giangvien/notifications
export async function GET(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const loai = searchParams.get("loai") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 15)));
  const offset = (page - 1) * limit;

  try {
    const supabase = createClient(await cookies());

    // Query notifications targeting everyone or teachers specifically, or created by this teacher
    let query = supabase
      .from("thongbao")
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .or(`doituong.eq.Tatca,doituong.eq.GiangVien,mataikhoantao.eq.${payload.mataikhoan}`);

    if (search) {
      query = query.ilike("tieude", `%${search}%`);
    }
    if (loai) {
      query = query.eq("loai", loai);
    }

    query = query
      .order("ghim", { ascending: false })
      .order("ngaytao", { ascending: false });

    const { data: rawData, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter in-memory for active/expired status (creators can see all their own notifications)
    const now = new Date();
    const filtered = (rawData ?? []).filter((tb: any) => {
      if (tb.mataikhoantao === payload.mataikhoan) return true;
      const ngaytaoTime = new Date(tb.ngaytao).getTime();
      const ngayhethanTime = tb.ngayhethan ? new Date(tb.ngayhethan).getTime() : null;
      if (ngaytaoTime > now.getTime()) return false;
      if (ngayhethanTime !== null && ngayhethanTime < now.getTime()) return false;
      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Fetch read status for the filtered/paginated notifications
    const ids = paginated.map((tb: any) => tb.mathongbao);
    const readMap: Record<number, { dadoc: boolean; thoigiandoc: string | null }> = {};

    if (ids.length > 0) {
      const { data: readRows } = await supabase
        .from("thongbaodadoc")
        .select("mathongbao, dadoc, thoigiandoc")
        .eq("mataikhoan", payload.mataikhoan)
        .in("mathongbao", ids);

      for (const r of readRows ?? []) {
        readMap[r.mathongbao] = { dadoc: r.dadoc, thoigiandoc: r.thoigiandoc };
      }
    }

    const data = paginated.map((tb: any) => ({
      ...tb,
      dadoc: readMap[tb.mathongbao]?.dadoc ?? false,
      thoigiandoc: readMap[tb.mathongbao]?.thoigiandoc ?? null,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/giangvien/notifications
// Creates a new notification (announcement)
export async function POST(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim } = body;

    if (!tieude || !tieude.trim()) {
      return NextResponse.json({ error: "Tiêu đề không được để trống" }, { status: 400 });
    }
    if (!noidung || !noidung.trim()) {
      return NextResponse.json({ error: "Nội dung không được để trống" }, { status: 400 });
    }

    const supabase = createClient(await cookies());

    const insertPayload: Record<string, any> = {
      mataikhoantao: payload.mataikhoan,
      tieude: tieude.trim(),
      noidung: noidung.trim(),
      loai: loai || "Chung",
      doituong: doituong || "Tatca",
      malop: malop || null,
      maphancong: maphancong ? Number(maphancong) : null,
      ngayhethan: ngayhethan || null,
      ghim: Boolean(ghim),
      ngaytao: new Date().toISOString(),
      ngaycapnhat: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("thongbao")
      .insert(insertPayload)
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/giangvien/notifications
// Marks notification(s) as read
export async function PATCH(req: Request) {
  const payload = await getTeacherPayload(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const supabase = createClient(await cookies());
    const vnNow = new Date().toISOString();

    if (body.all === true) {
      // Find all active notifications for teachers
      const { data: all, error: findError } = await supabase
        .from("thongbao")
        .select("mathongbao")
        .or(`doituong.eq.Tatca,doituong.eq.GiangVien`);

      if (findError) {
        return NextResponse.json({ error: findError.message }, { status: 500 });
      }

      if (!all || all.length === 0) {
        return NextResponse.json({ success: true });
      }

      const tbIds = all.map((tb) => tb.mathongbao);
      
      // Delete existing records to avoid conflict
      await supabase
        .from("thongbaodadoc")
        .delete()
        .eq("mataikhoan", payload.mataikhoan)
        .in("mathongbao", tbIds);

      // Insert new read records
      const insertRows = all.map((tb) => ({
        mathongbao: tb.mathongbao,
        mataikhoan: payload.mataikhoan,
        dadoc: true,
        thoigiandoc: vnNow,
      }));

      const { error: insertError } = await supabase
        .from("thongbaodadoc")
        .insert(insertRows);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (!body.mathongbao || typeof body.mathongbao !== "number") {
      return NextResponse.json({ error: "mathongbao không hợp lệ" }, { status: 400 });
    }

    // Delete existing to avoid conflict
    await supabase
      .from("thongbaodadoc")
      .delete()
      .eq("mathongbao", body.mathongbao)
      .eq("mataikhoan", payload.mataikhoan);

    // Insert only if dadoc is true
    if (body.dadoc !== false) {
      const { error: insertError } = await supabase
        .from("thongbaodadoc")
        .insert({
          mathongbao: body.mathongbao,
          mataikhoan: payload.mataikhoan,
          dadoc: true,
          thoigiandoc: vnNow,
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
