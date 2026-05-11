import { SupabaseClient } from "@supabase/supabase-js";

export async function getKhoaListRepo(supabase: SupabaseClient, search?: string) {
  let query = supabase
    .from("khoa")
    .select("makhoa, tenkhoa, dienthoai, email, ngaytao")
    .order("ngaytao", { ascending: false });

  if (search) {
    query = query.ilike("tenkhoa", `%${search}%`);
  }

  return query;
}

export async function createKhoaRepo(supabase: SupabaseClient, payload: Record<string, unknown>) {
  return supabase
    .from("khoa")
    .insert(payload)
    .select()
    .single();
}

export async function updateKhoaRepo(supabase: SupabaseClient, makhoa: string, payload: Record<string, unknown>) {
  return supabase
    .from("khoa")
    .update(payload)
    .eq("makhoa", makhoa)
    .select()
    .single();
}

export async function deleteKhoaRepo(supabase: SupabaseClient, makhoa: string) {
  return supabase.from("khoa").delete().eq("makhoa", makhoa);
}
