import { SupabaseClient } from "@supabase/supabase-js";

export async function getLopListRepo(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; from: number; to: number }
) {
  let query = supabase
    .from("lop")
    .select("malop, tenlop, nganh, khoahoc, siso, makhoa, magv, khoa(tenkhoa), giangvien(hoten)", { count: "exact" })
    .order("malop", { ascending: true })
    .range(params.from, params.to);

  if (params.search) query = query.ilike("tenlop", `%${params.search}%`);
  if (params.makhoa) query = query.eq("makhoa", params.makhoa);

  return query;
}

export async function createLopRepo(supabase: SupabaseClient, payload: Record<string, unknown>) {
  return supabase.from("lop").insert(payload).select().single();
}

export async function updateLopRepo(supabase: SupabaseClient, malop: string, payload: Record<string, unknown>) {
  return supabase.from("lop").update(payload).eq("malop", malop).select().single();
}

export async function deleteLopRepo(supabase: SupabaseClient, malop: string) {
  return supabase.from("lop").delete().eq("malop", malop);
}
