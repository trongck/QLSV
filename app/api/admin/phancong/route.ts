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
  } catch { return null; }
}

// ─── GET /api/admin/phancong ──────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const from = (page - 1) * limit;

  const search = searchParams.get("search") ?? "";
  const magv = searchParams.get("magv") ?? "";
  const mamon = searchParams.get("mamon") ?? "";
  const malop = searchParams.get("malop") ?? "";
  const mahocky = searchParams.get("mahocky") ?? "";

  const supabase = createClient(await cookies());

  let query = supabase
    .from("phancong")
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)", { count: "exact" });

  if (search) {
    query = query.or(`malophoc.ilike.%${search}%`);
  }
  if (magv) query = query.eq("magv", magv);
  if (mamon) query = query.eq("mamon", mamon);
  if (malop) query = query.eq("malop", malop);
  if (mahocky) query = query.eq("mahocky", parseInt(mahocky));

  // Determine pagination vs simple query
  const hasPage = searchParams.has("page");
  if (hasPage) {
    query = query.order("maphancong", { ascending: false }).range(from, from + limit - 1);
  } else {
    query = query.order("maphancong", { ascending: false }).limit(limit);
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

// ─── POST /api/admin/phancong ─────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { magv, mamon, malop, mahocky, malophoc, sisomax, danghieuluc } = body;

    // Validate inputs
    if (!magv?.trim()) return NextResponse.json({ error: "Giảng viên là bắt buộc." }, { status: 400 });
    if (!mamon?.trim()) return NextResponse.json({ error: "Môn học là bắt buộc." }, { status: 400 });
    if (!malop?.trim()) return NextResponse.json({ error: "Lớp học là bắt buộc." }, { status: 400 });
    if (!mahocky) return NextResponse.json({ error: "Học kỳ là bắt buộc." }, { status: 400 });

    const maxSize = sisomax ? parseInt(sisomax) : null;
    if (maxSize !== null && (isNaN(maxSize) || maxSize <= 0)) {
      return NextResponse.json({ error: "Sĩ số tối đa phải là số nguyên dương." }, { status: 400 });
    }

    const supabase = createClient(await cookies());

    // Check if duplicate assignment exists (same magv, mamon, malop, mahocky, malophoc)
    const checkQuery = supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv.trim())
      .eq("mamon", mamon.trim())
      .eq("malop", malop.trim())
      .eq("mahocky", parseInt(mahocky));
    
    if (malophoc?.trim()) {
      checkQuery.eq("malophoc", malophoc.trim());
    } else {
      checkQuery.is("malophoc", null);
    }

    const { data: duplicateData, error: duplicateError } = await checkQuery;
    if (duplicateError) return NextResponse.json({ error: duplicateError.message }, { status: 500 });
    if (duplicateData && duplicateData.length > 0) {
      return NextResponse.json({ error: "Phân công này đã tồn tại trong hệ thống." }, { status: 400 });
    }

    // Fetch max ID to avoid out-of-sync sequence conflicts
    const { data: maxPc } = await supabase
      .from("phancong")
      .select("maphancong")
      .order("maphancong", { ascending: false })
      .limit(1);

    const nextId = maxPc && maxPc.length > 0 ? maxPc[0].maphancong + 1 : 1;

    // Insert new assignment
    const { data, error } = await supabase
      .from("phancong")
      .insert({
        maphancong: nextId,
        magv: magv.trim(),
        mamon: mamon.trim(),
        malop: malop.trim(),
        mahocky: parseInt(mahocky),
        malophoc: malophoc?.trim() || null,
        sisomax: maxSize,
        danghieuluc: danghieuluc ?? true,
      })
      .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
