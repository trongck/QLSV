import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro, DoiTuongThongBao } from "@/types";

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireStudent(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.SinhVien ? payload : null;
  } catch {
    return null;
  }
}

// ─── GET /api/student/notification ────────────────────────────────────────────

export async function GET(request: Request) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const loai   = searchParams.get("loai")   ?? "";
  const tab    = searchParams.get("tab")    ?? "tatca";
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  const supabase = createClient(await cookies());

  // Lấy thông tin sinh viên
  const { data: svData, error: svError } = await supabase
    .from("sinhvien")
    .select("masv, malop")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (svError || !svData) {
    return NextResponse.json({ error: "Không tìm thấy thông tin sinh viên." }, { status: 404 });
  }

  const { masv, malop } = svData;
  const now = new Date().toISOString().replace("Z", "");

  // ─── Lấy danh sách phân công môn học ──────────────────────────────────────
  const { data: svMonHoc } = await supabase
    .from("sinhvienmonhoc")
    .select("maphancong")
    .eq("masv", masv)
    .eq("trangthai", "Danghoc");

  const myAssignments = (svMonHoc ?? []).map((m: any) => m.maphancong);

  // ─── Query thông báo ──────────────────────────────────────────────────────
  let conditions = [
    `doituong.eq.${DoiTuongThongBao.Tatca}`,
    `and(doituong.eq.${DoiTuongThongBao.SinhVien},or(malop.is.null,malop.eq.${malop || "NONE"}))`
  ];

  if (myAssignments.length > 0) {
    conditions.push(`and(doituong.neq.${DoiTuongThongBao.GiangVien},maphancong.in.(${myAssignments.join(",")}))`);
  }

  let query = supabase
    .from("thongbao")
    .select(
      `mathongbao, tieude, noidung, loai, doituong, malop, ghim, ngaytao, ngayhethan,
       taikhoan:mataikhoantao(email, vaitro),
       lop:malop(tenlop)`,
      { count: "exact" }
    )
    .or(conditions.join(","))
    .lte("ngaytao", now)
    .or("ngayhethan.is.null,ngayhethan.gte." + now)
    .order("ghim", { ascending: false })
    .order("ngaytao", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike("tieude", `%${search}%`);
  if (loai)   query = query.eq("loai", loai);

  const { data: rawData, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!rawData || rawData.length === 0) {
    return NextResponse.json({
      data: [],
      masv,
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  // ─── Lấy trạng thái đã đọc riêng ────────────────────────────────────────
  const ids = rawData.map((tb: any) => tb.mathongbao);
  const { data: readRows } = await supabase
    .from("thongbaodadoc")
    .select("mathongbao, dadoc, thoigiandoc")
    .eq("mataikhoan", payload.mataikhoan)
    .in("mathongbao", ids);

  const readMap: Record<number, { dadoc: boolean; thoigiandoc: string | null }> = {};
  for (const r of readRows ?? []) {
    readMap[r.mathongbao] = { dadoc: r.dadoc, thoigiandoc: r.thoigiandoc };
  }

  // Merge dadoc vào từng thông báo
  const data = rawData.map((tb: any) => ({
    ...tb,
    dadoc:       readMap[tb.mathongbao]?.dadoc       ?? false,
    thoigiandoc: readMap[tb.mathongbao]?.thoigiandoc ?? null,
  }));

  // Lọc theo tab
  const filtered =
    tab === "chuadoc" ? data.filter((d: any) => !d.dadoc) :
    tab === "dadoc"   ? data.filter((d: any) =>  d.dadoc) :
    data;

  return NextResponse.json({
    data: filtered,
    masv,
    pagination: {
      page,
      limit,
      total:      tab === "tatca" ? (count ?? 0) : filtered.length,
      totalPages: Math.ceil((tab === "tatca" ? (count ?? 0) : filtered.length) / limit),
    },
  });
}
