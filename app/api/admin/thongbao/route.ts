import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.Admin ? payload : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const loai = searchParams.get("loai") ?? "";
  const doituong = searchParams.get("doituong") ?? "";
  const trangthai = searchParams.get("trangthai") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 15)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());

  let query = supabase
    .from("thongbao")
    .select("*, admin:maadmintao(hoten), giangvien:magvtao(hoten), lop:malop(tenlop)", { count: "exact" })
    .order("ghim", { ascending: false })
    .order("ngaytao", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("tieude", `%${search}%`);
  if (loai) query = query.eq("loai", loai);
  if (doituong) query = query.eq("doituong", doituong);

  const nowStr = new Date().toISOString().replace("Z", "");
  if (trangthai === "Active") {
    query = query.lte("ngaytao", nowStr).or(`ngayhethan.is.null,ngayhethan.gte.${nowStr}`);
  } else if (trangthai === "Scheduled") {
    query = query.gt("ngaytao", nowStr);
  } else if (trangthai === "Expired") {
    query = query.lt("ngayhethan", nowStr);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit)
    },
  });
}

export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim, ngaytao } = body;

  if (!tieude?.trim()) return NextResponse.json({ error: "Tiêu đề không được trống." }, { status: 400 });
  if (!noidung?.trim()) return NextResponse.json({ error: "Nội dung không được trống." }, { status: 400 });
  if (!loai) return NextResponse.json({ error: "Loại thông báo không được trống." }, { status: 400 });
  if (!doituong) return NextResponse.json({ error: "Đối tượng không được trống." }, { status: 400 });

  const supabase = createClient(await cookies());

  // Lấy maadmin từ mataikhoan trong token
  let maadmintao: string | null = null;
  const { data: adminData } = await supabase
    .from("admin")
    .select("maadmin")
    .eq("mataikhoan", adminPayload.mataikhoan)
    .single();
  
  if (adminData) {
    maadmintao = adminData.maadmin;
  } else {
    // Dự phòng: lấy bất kỳ admin nào nếu không tìm thấy profile chính xác
    const { data: anyAdmin } = await supabase.from("admin").select("maadmin").limit(1).single();
    maadmintao = anyAdmin?.maadmin ?? null;
  }

  const insertPayload: Record<string, any> = {
    tieude: tieude.trim(),
    noidung: noidung.trim(),
    loai,
    doituong,
    malop: malop || null,
    maphancong: maphancong ? Number(maphancong) : null,
    ngayhethan: ngayhethan || null,
    ghim: Boolean(ghim),
    maadmintao,
    magvtao: null,
  };

  if (ngaytao) {
    insertPayload.ngaytao = ngaytao;
  }

  const { data, error } = await supabase
    .from("thongbao")
    .insert(insertPayload)
    .select("*, admin:maadmintao(hoten), lop:malop(tenlop)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
