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

export async function PUT(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  const body = await request.json();
  const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim, ngaytao } = body;

  if (!tieude?.trim()) return NextResponse.json({ error: "Tiêu đề không được trống." }, { status: 400 });
  if (!noidung?.trim()) return NextResponse.json({ error: "Nội dung không được trống." }, { status: 400 });

  const supabase = createClient(await cookies());

  const updatePayload: Record<string, any> = {
    tieude: tieude.trim(),
    noidung: noidung.trim(),
    loai,
    doituong,
    malop: malop || null,
    maphancong: maphancong ? Number(maphancong) : null,
    ngayhethan: ngayhethan || null,
    ghim: Boolean(ghim),
  };

  if (ngaytao) {
    updatePayload.ngaytao = ngaytao;
  }

  const { data, error } = await supabase
    .from("thongbao")
    .update(updatePayload)
    .eq("mathongbao", id)
    .select("*, admin:maadmintao(hoten), lop:malop(tenlop)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "UPDATE",
    tentable: "thongbao",
    makhoachinh: String(id),
    giatrimoi: data,
    request,
  });

  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  const supabase = createClient(await cookies());

  const { error } = await supabase.from("thongbao").delete().eq("mathongbao", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "DELETE",
    tentable: "thongbao",
    makhoachinh: String(id),
    request,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ mathongbao: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mathongbao } = await params;
  const id = Number(mathongbao);
  const body = await request.json();

  // Sanitize body: empty strings to null for nullable fields IF they are provided
  if (body.malop === "") body.malop = null;
  if (body.maphancong === "") body.maphancong = null;
  else if (body.maphancong !== undefined && body.maphancong !== null) body.maphancong = Number(body.maphancong);

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("thongbao")
    .update(body)
    .eq("mathongbao", id)
    .select("*, admin:maadmintao(hoten), lop:malop(tenlop)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "PATCH",
    tentable: "thongbao",
    makhoachinh: String(id),
    giatrimoi: data,
    request,
  });

  return NextResponse.json({ data });
}
