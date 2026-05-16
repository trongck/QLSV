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
  } catch {
    return null;
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ mamon: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mamon } = await params;
  const body = await request.json();
  const { tenmon, sotinchi, sotietlythuyet, sotietthuchanh, mota, batbuoc, makhoa } = body;

  if (!tenmon?.trim()) return NextResponse.json({ error: "Tên môn không được trống." }, { status: 400 });
  if (!sotinchi || Number(sotinchi) < 1 || Number(sotinchi) > 10) return NextResponse.json({ error: "Số tín chỉ phải từ 1-10." }, { status: 400 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("monhoc")
    .update({
      tenmon: tenmon.trim(),
      sotinchi: Number(sotinchi),
      sotietlythuyet: sotietlythuyet ? Number(sotietlythuyet) : null,
      sotietthuchanh: sotietthuchanh ? Number(sotietthuchanh) : null,
      mota: mota?.trim() || null,
      batbuoc: Boolean(batbuoc),
      makhoa: makhoa || null,
    })
    .eq("mamon", mamon)
    .select("*, khoa:makhoa(tenkhoa)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "UPDATE",
    tentable: "monhoc",
    makhoachinh: mamon,
    giatrimoi: data,
    request,
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mamon: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mamon } = await params;
  const supabase = createClient(await cookies());

  // Kiểm tra ràng buộc khoá ngoại trước khi xoá
  const { count } = await supabase
    .from("phancong")
    .select("*", { count: "exact", head: true })
    .eq("mamon", mamon);

  if (count && count > 0) {
    return NextResponse.json({ error: "Môn học đang có phân công, không thể xoá." }, { status: 409 });
  }

  const { error } = await supabase.from("monhoc").delete().eq("mamon", mamon);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "DELETE",
    tentable: "monhoc",
    makhoachinh: mamon,
    request,
  });

  return NextResponse.json({ success: true });
}
