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

// ─── GET /api/admin/phonghoc ─────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("phonghoc")
    .select("maphong, loaiphong, suchua")
    .order("maphong", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data });
}
