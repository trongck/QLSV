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

export async function PUT(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mahk } = await params;
  const id = Number(mahk);
  const body = await request.json();
  const { tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc } = body;

  if (!tenhocky?.trim()) return NextResponse.json({ error: "Tên học kỳ không được trống." }, { status: 400 });
  if (!namhoc || namhoc < 2000 || namhoc > 2100) return NextResponse.json({ error: "Năm học không hợp lệ." }, { status: 400 });
  if (![1, 2, 3].includes(Number(ky))) return NextResponse.json({ error: "Kỳ học phải là 1, 2 hoặc 3." }, { status: 400 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("hocky")
    .update({
      tenhocky: tenhocky.trim(),
      namhoc: Number(namhoc),
      ky: Number(ky),
      ngaybatdau: ngaybatdau || null,
      ngayketthuc: ngayketthuc || null,
      danghieuluc: Boolean(danghieuluc)
    })
    .eq("mahocky", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mahk } = await params;
  const id = Number(mahk);
  const supabase = createClient(await cookies());

  // Kiểm tra ràng buộc khoá ngoại trước khi xoá
  const { count } = await supabase
    .from("phancong")
    .select("*", { count: "exact", head: true })
    .eq("mahocky", id);

  if (count && count > 0) {
    return NextResponse.json({ error: "Học kỳ đang có phân công, không thể xoá." }, { status: 409 });
  }

  const { error } = await supabase.from("hocky").delete().eq("mahocky", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ mahk: string }> }) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mahk } = await params;
  const id = Number(mahk);
  const supabase = createClient(await cookies());

  // Vô hiệu hoá tất cả các học kỳ khác khi kích hoạt học kỳ này
  await supabase.from("hocky").update({ danghieuluc: false }).neq("mahocky", id);

  const { data, error } = await supabase
    .from("hocky")
    .update({ danghieuluc: true })
    .eq("mahocky", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
