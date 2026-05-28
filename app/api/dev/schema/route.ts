import { NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get("table") || "sinhvien";
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.from(table).select("*").limit(1);
  return NextResponse.json({ error, keys: data && data.length > 0 ? Object.keys(data[0]) : [] });
}
