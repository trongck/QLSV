import { NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase.from("thongbao").select("*").limit(1);
    if (error) return NextResponse.json({ error: error.message });
    return NextResponse.json({ keys: data && data[0] ? Object.keys(data[0]) : [], sample: data && data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
