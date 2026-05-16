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

export async function PUT(request: Request, { params }: { params: Promise<{ malop: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { malop } = await params;
  const body = await request.json();
  const { tenlop, makhoa, nganh, khoahoc, magv } = body;

  if (!tenlop?.trim())
    return NextResponse.json({ error: "Tên lớp là bắt buộc." }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("lop")
    .update({ tenlop: tenlop.trim(), makhoa: makhoa || null, nganh: nganh || null, khoahoc: khoahoc || null, magv: magv || null })
    .eq("malop", malop)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "UPDATE",
    tentable: "lop",
    makhoachinh: malop,
    giatrimoi: data,
    request,
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ malop: string }> }) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { malop } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("lop").delete().eq("malop", malop);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAuditAction({
    supabase,
    mataikhoan: adminPayload.mataikhoan,
    hanhdong: "DELETE",
    tentable: "lop",
    makhoachinh: malop,
    request,
  });

  return NextResponse.json({ success: true });
}