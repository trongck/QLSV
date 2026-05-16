import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.Admin ? payload : null;
  } catch { return null; }
}

// ─── GET /api/admin/lichhoc ───────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const from = (page - 1) * limit;

  const maphancong = searchParams.get("maphancong") ?? "";
  const thutrongtuan = searchParams.get("thutrongtuan") ?? "";
  const magv = searchParams.get("magv") ?? "";
  const malop = searchParams.get("malop") ?? "";
  const mahocky = searchParams.get("mahocky") ?? "";
  const phonghoc = searchParams.get("phonghoc") ?? "";

  const supabase = createClient(await cookies());

  // We use phancong!inner to allow filtering by nested fields if those filters are provided
  let useInnerJoin = !!(magv || malop || mahocky);
  let relationString = useInnerJoin
    ? "*, phancong!inner(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))"
    : "*, phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))";

  let query = supabase.from("lichhoc").select(relationString, { count: "exact" });

  if (maphancong) query = query.eq("maphancong", parseInt(maphancong));
  if (thutrongtuan) query = query.eq("thutrongtuan", parseInt(thutrongtuan));
  if (phonghoc) query = query.ilike("phonghoc", `%${phonghoc}%`);

  if (magv) query = query.eq("phancong.magv", magv);
  if (malop) query = query.eq("phancong.malop", malop);
  if (mahocky) query = query.eq("phancong.mahocky", parseInt(mahocky));

  const hasPage = searchParams.has("page");
  if (hasPage) {
    query = query
      .order("thutrongtuan", { ascending: true })
      .order("tietbatdau", { ascending: true })
      .range(from, from + limit - 1);
  } else {
    query = query
      .order("thutrongtuan", { ascending: true })
      .order("tietbatdau", { ascending: true })
      .limit(limit);
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (hasPage) {
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  }

  return NextResponse.json({ success: true, data });
}

// ─── POST /api/admin/lichhoc ──────────────────────────────────────────────────
export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { maphancong, thutrongtuan, tietbatdau, tietketthuc, phonghoc, loaiphong, ghichu } = body;

    // Standard validations
    if (!maphancong) return NextResponse.json({ error: "Mã phân công là bắt buộc." }, { status: 400 });
    
    const thu = parseInt(thutrongtuan);
    if (isNaN(thu) || thu < 2 || thu > 8) {
      return NextResponse.json({ error: "Thứ trong tuần không hợp lệ (nhập từ 2 đến 8)." }, { status: 400 });
    }

    const tbd = parseInt(tietbatdau);
    const tkt = parseInt(tietketthuc);
    if (isNaN(tbd) || tbd < 1 || tbd > 15 || isNaN(tkt) || tkt < 1 || tkt > 15) {
      return NextResponse.json({ error: "Tiết học phải từ 1 đến 15." }, { status: 400 });
    }
    if (tbd > tkt) {
      return NextResponse.json({ error: "Tiết bắt đầu không thể lớn hơn tiết kết thúc." }, { status: 400 });
    }

    const supabase = createClient(await cookies());

    // Get information about the assignment (semester, teacher, class)
    const { data: pc, error: pcError } = await supabase
      .from("phancong")
      .select("mahocky, magv, malop, monhoc:mamon(tenmon)")
      .eq("maphancong", parseInt(maphancong))
      .single();

    if (pcError || !pc) {
      return NextResponse.json({ error: "Không tìm thấy phân công giảng dạy tương ứng." }, { status: 404 });
    }

    // 1. Conflict check for Teacher
    const { data: teacherConflicts, error: tcError } = await supabase
      .from("lichhoc")
      .select("*, phancong!inner(magv, mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
      .eq("phancong.magv", pc.magv)
      .eq("phancong.mahocky", pc.mahocky)
      .eq("thutrongtuan", thu);

    if (tcError) return NextResponse.json({ error: tcError.message }, { status: 500 });
    
    for (const item of (teacherConflicts || [])) {
      if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
        return NextResponse.json({
          error: `Trùng lịch giảng viên: Giảng viên đã có lịch dạy môn "${item.phancong.monhoc.tenmon}" cho lớp "${item.phancong.lop.tenlop}" tại phòng "${item.phonghoc || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
        }, { status: 400 });
      }
    }

    // 2. Conflict check for Class
    const { data: classConflicts, error: ccError } = await supabase
      .from("lichhoc")
      .select("*, phancong!inner(malop, mahocky, monhoc:mamon(tenmon), giangvien:magv(hoten))")
      .eq("phancong.malop", pc.malop)
      .eq("phancong.mahocky", pc.mahocky)
      .eq("thutrongtuan", thu);

    if (ccError) return NextResponse.json({ error: ccError.message }, { status: 500 });

    for (const item of (classConflicts || [])) {
      if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
        return NextResponse.json({
          error: `Trùng lịch lớp học: Lớp đã có lịch học môn "${item.phancong.monhoc.tenmon}" với Giảng viên "${item.phancong.giangvien.hoten}" tại phòng "${item.phonghoc || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
        }, { status: 400 });
      }
    }

    // 3. Conflict check for Room (if not Online)
    if (phonghoc?.trim() && loaiphong !== "Online") {
      const { data: roomConflicts, error: rcError } = await supabase
        .from("lichhoc")
        .select("*, phancong!inner(mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
        .eq("phonghoc", phonghoc.trim())
        .eq("phancong.mahocky", pc.mahocky)
        .eq("thutrongtuan", thu);

      if (rcError) return NextResponse.json({ error: rcError.message }, { status: 500 });

      for (const item of (roomConflicts || [])) {
        if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
          return NextResponse.json({
            error: `Trùng lịch phòng học: Phòng "${phonghoc.trim()}" đã được đăng ký sử dụng bởi lớp "${item.phancong.lop.tenlop}" học môn "${item.phancong.monhoc.tenmon}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
          }, { status: 400 });
        }
      }
    }

    // Fetch max ID to avoid out-of-sync sequence conflicts
    const { data: maxLh } = await supabase
      .from("lichhoc")
      .select("malichhoc")
      .order("malichhoc", { ascending: false })
      .limit(1);

    const nextId = maxLh && maxLh.length > 0 ? maxLh[0].malichhoc + 1 : 1;

    // Insert new schedule
    const { data, error } = await supabase
      .from("lichhoc")
      .insert({
        malichhoc: nextId,
        maphancong: parseInt(maphancong),
        thutrongtuan: thu,
        tietbatdau: tbd,
        tietketthuc: tkt,
        phonghoc: phonghoc?.trim() || null,
        loaiphong: loaiphong || "Lythuyet",
        ghichu: ghichu?.trim() || null,
      })
      .select("*, phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await logAuditAction({
      supabase,
      mataikhoan: adminPayload.mataikhoan,
      hanhdong: "INSERT",
      tentable: "lichhoc",
      makhoachinh: String(data.malichhoc),
      giatrimoi: data,
      request,
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
