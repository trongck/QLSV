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

// ─── PUT /api/admin/lichhoc/[malichhoc] ──────────────────────────────────────
export async function PUT(request: Request, { params }: { params: Promise<{ malichhoc: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { malichhoc } = await params;
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

    const scheduleId = parseInt(malichhoc);

    // 1. Conflict check for Teacher (excluding this schedule)
    const { data: teacherConflicts, error: tcError } = await supabase
      .from("lichhoc")
      .select("*, phancong!inner(magv, mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
      .eq("phancong.magv", pc.magv)
      .eq("phancong.mahocky", pc.mahocky)
      .eq("thutrongtuan", thu)
      .neq("malichhoc", scheduleId);

    if (tcError) return NextResponse.json({ error: tcError.message }, { status: 500 });
    
    for (const item of (teacherConflicts || [])) {
      if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
        return NextResponse.json({
          error: `Trùng lịch giảng viên: Giảng viên đã có lịch dạy môn "${item.phancong.monhoc.tenmon}" cho lớp "${item.phancong.lop.tenlop}" tại phòng "${item.phonghoc || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
        }, { status: 400 });
      }
    }

    // 2. Conflict check for Class (excluding this schedule)
    const { data: classConflicts, error: ccError } = await supabase
      .from("lichhoc")
      .select("*, phancong!inner(malop, mahocky, monhoc:mamon(tenmon), giangvien:magv(hoten))")
      .eq("phancong.malop", pc.malop)
      .eq("phancong.mahocky", pc.mahocky)
      .eq("thutrongtuan", thu)
      .neq("malichhoc", scheduleId);

    if (ccError) return NextResponse.json({ error: ccError.message }, { status: 500 });

    for (const item of (classConflicts || [])) {
      if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
        return NextResponse.json({
          error: `Trùng lịch lớp học: Lớp đã có lịch học môn "${item.phancong.monhoc.tenmon}" với Giảng viên "${item.phancong.giangvien.hoten}" tại phòng "${item.phonghoc || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
        }, { status: 400 });
      }
    }

    // 3. Conflict check for Room (if not Online, excluding this schedule)
    if (phonghoc?.trim() && loaiphong !== "Online") {
      const { data: roomConflicts, error: rcError } = await supabase
        .from("lichhoc")
        .select("*, phancong!inner(mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
        .eq("phonghoc", phonghoc.trim())
        .eq("phancong.mahocky", pc.mahocky)
        .eq("thutrongtuan", thu)
        .neq("malichhoc", scheduleId);

      if (rcError) return NextResponse.json({ error: rcError.message }, { status: 500 });

      for (const item of (roomConflicts || [])) {
        if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
          return NextResponse.json({
            error: `Trùng lịch phòng học: Phòng "${phonghoc.trim()}" đã được đăng ký sử dụng bởi lớp "${item.phancong.lop.tenlop}" học môn "${item.phancong.monhoc.tenmon}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`
          }, { status: 400 });
        }
      }
    }

    // Update schedule
    const { data, error } = await supabase
      .from("lichhoc")
      .update({
        maphancong: parseInt(maphancong),
        thutrongtuan: thu,
        tietbatdau: tbd,
        tietketthuc: tkt,
        phonghoc: phonghoc?.trim() || null,
        loaiphong: loaiphong || "Lythuyet",
        ghichu: ghichu?.trim() || null,
      })
      .eq("malichhoc", scheduleId)
      .select("*, phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/lichhoc/[malichhoc] ───────────────────────────────────
export async function DELETE(request: Request, { params }: { params: Promise<{ malichhoc: string }> }) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { malichhoc } = await params;
    const supabase = createClient(await cookies());

    // Check if there are any dependent sessions (buoihoc) created for this schedule
    const { data: sessions, error: sessionsError } = await supabase
      .from("buoihoc")
      .select("mabuoihoc")
      .eq("malichhoc", parseInt(malichhoc))
      .limit(1);

    if (sessionsError) return NextResponse.json({ error: sessionsError.message }, { status: 500 });
    if (sessions && sessions.length > 0) {
      return NextResponse.json({ error: "Không thể xoá lịch học này vì đã có dữ liệu buổi học thực tế đi kèm." }, { status: 400 });
    }

    const { error } = await supabase
      .from("lichhoc")
      .delete()
      .eq("malichhoc", parseInt(malichhoc));

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
