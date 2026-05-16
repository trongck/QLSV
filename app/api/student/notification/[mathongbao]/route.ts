import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro, DoiTuongThongBao } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

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

// ─── GET /api/student/notification/[mathongbao] ───────────────────────────────
// Lấy chi tiết 1 thông báo và đồng thời đánh dấu đã đọc cho sinh viên.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  // Lấy masv của sinh viên
  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv, malop")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json({ error: "Không tìm thấy thông tin sinh viên." }, { status: 404 });
  }

  const { masv, malop } = svData;
  const now = new Date().toISOString().replace("Z", "");

  // Lấy thông báo — kiểm tra quyền truy cập
  const { data: tb, error } = await supabase
    .from("thongbao")
    .select(
      `mathongbao, tieude, noidung, loai, doituong, malop, ghim, ngaytao, ngayhethan, ngaycapnhat,
       admin:maadmintao(hoten),
       giangvien:magvtao(hoten),
       lop:malop(tenlop)`
    )
    .eq("mathongbao", id)
    .in("doituong", [DoiTuongThongBao.Tatca, DoiTuongThongBao.SinhVien])
    .lte("ngaytao", now)
    .or(`ngayhethan.is.null,ngayhethan.gte.${now}`)
    .or(`malop.is.null,malop.eq.${malop}`)
    .single();

  if (error || !tb) {
    return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  }

  // ─── Đánh dấu đã đọc (upsert) ────────────────────────────────────────────
  const { data: existingRead } = await supabase
    .from("thongbaodadocsv")
    .select("dadoc")
    .eq("mathongbao", id)
    .eq("masv", masv)
    .single();

  let dadoc = existingRead?.dadoc ?? false;
  let thoigiandoc: string | null = null;

  if (!existingRead) {
    // Chưa có record → insert mới
    const now2 = new Date().toISOString();
    const { error: insertErr } = await supabase.from("thongbaodadocsv").insert({
      mathongbao: id,
      masv,
      dadoc: true,
      thoigiandoc: now2,
    });
    if (!insertErr) {
      dadoc = true;
      thoigiandoc = now2;
    }
  } else if (!existingRead.dadoc) {
    // Có record nhưng chưa đánh dấu đã đọc → update
    const now2 = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("thongbaodadocsv")
      .update({ dadoc: true, thoigiandoc: now2 })
      .eq("mathongbao", id)
      .eq("masv", masv);
    if (!updateErr) {
      dadoc = true;
      thoigiandoc = now2;
    }
  } else {
    const { data: readRow } = await supabase
      .from("thongbaodadocsv")
      .select("thoigiandoc")
      .eq("mathongbao", id)
      .eq("masv", masv)
      .single();
    thoigiandoc = readRow?.thoigiandoc ?? null;
  }

  // Nếu trạng thái thay đổi từ chưa đọc sang đã đọc (insert/update thành công) thì log
  if (!existingRead?.dadoc && dadoc) {
    await logAuditAction({
      supabase,
      mataikhoan: payload.mataikhoan,
      hanhdong: "UPDATE",
      tentable: "thongbaodadocsv",
      makhoachinh: `${id}_${masv}`,
      giatrimoi: { mathongbao: id, masv, dadoc: true, thoigiandoc },
      request,
    });
  }

  return NextResponse.json({ data: { ...tb, dadoc, thoigiandoc } });
}

// ─── PATCH /api/student/notification/[mathongbao] ────────────────────────────
// Đánh dấu đã đọc thủ công (không cần GET chi tiết).

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ mathongbao: string }> }
) {
  const payload = await requireStudent(request);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "mathongbao không hợp lệ." }, { status: 400 });
  }

  const supabase = createClient(await cookies());

  const { data: svData } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("mataikhoan", payload.mataikhoan)
    .single();

  if (!svData) {
    return NextResponse.json({ error: "Không tìm thấy thông tin sinh viên." }, { status: 404 });
  }

  const { masv } = svData;
  const now = new Date().toISOString();

  const { error } = await supabase.from("thongbaodadocsv").upsert(
    { mathongbao: id, masv, dadoc: true, thoigiandoc: now },
    { onConflict: "mathongbao,masv" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: payload.mataikhoan,
    hanhdong: "UPDATE",
    tentable: "thongbaodadocsv",
    makhoachinh: `${id}_${masv}`,
    giatrimoi: { mathongbao: id, masv, dadoc: true, thoigiandoc: now },
    request,
  });

  return NextResponse.json({ success: true, thoigiandoc: now });
}
