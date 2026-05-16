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

// ─── PUT /api/admin/phancong/[maphancong] ────────────────────────────────────
export async function PUT(request: Request, { params }: { params: Promise<{ maphancong: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { maphancong } = await params;
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

    // Check if duplicate assignment exists for other IDs
    const checkQuery = supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv.trim())
      .eq("mamon", mamon.trim())
      .eq("malop", malop.trim())
      .eq("mahocky", parseInt(mahocky))
      .neq("maphancong", parseInt(maphancong));
    
    if (malophoc?.trim()) {
      checkQuery.eq("malophoc", malophoc.trim());
    } else {
      checkQuery.is("malophoc", null);
    }

    const { data: duplicateData, error: duplicateError } = await checkQuery;
    if (duplicateError) return NextResponse.json({ error: duplicateError.message }, { status: 500 });
    if (duplicateData && duplicateData.length > 0) {
      return NextResponse.json({ error: "Phân công trùng lặp với một phân công khác đang tồn tại." }, { status: 400 });
    }

    // Update assignment
    const { data, error } = await supabase
      .from("phancong")
      .update({
        magv: magv.trim(),
        mamon: mamon.trim(),
        malop: malop.trim(),
        mahocky: parseInt(mahocky),
        malophoc: malophoc?.trim() || null,
        sisomax: maxSize,
        danghieuluc: danghieuluc ?? true,
      })
      .eq("maphancong", parseInt(maphancong))
      .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/phancong/[maphancong] ─────────────────────────────────
export async function DELETE(request: Request, { params }: { params: Promise<{ maphancong: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { maphancong } = await params;
    const supabase = createClient(await cookies());

    // Check references to see if they prevent deleting
    // In database, lichhoc depends on maphancong.
    const { data: scheduleCheck, error: scheduleCheckError } = await supabase
      .from("lichhoc")
      .select("malichhoc")
      .eq("maphancong", parseInt(maphancong))
      .limit(1);

    if (scheduleCheckError) return NextResponse.json({ error: scheduleCheckError.message }, { status: 500 });
    if (scheduleCheck && scheduleCheck.length > 0) {
      return NextResponse.json({ error: "Không thể xoá phân công này vì đang có lịch học đi kèm. Hãy xoá lịch học trước." }, { status: 400 });
    }

    const { error } = await supabase
      .from("phancong")
      .delete()
      .eq("maphancong", parseInt(maphancong));

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
