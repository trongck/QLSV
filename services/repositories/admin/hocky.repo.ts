import { SupabaseClient } from "@supabase/supabase-js";

export async function getHockyListRepo(
  supabase: SupabaseClient,
  params: { search?: string; namhoc?: number }
) {
  let query = supabase
    .from("hocky")
    .select("*", { count: "exact" })
    .order("namhoc", { ascending: false })
    .order("ky", { ascending: true });

  if (params.search) query = query.ilike("tenhocky", `%${params.search}%`);
  if (params.namhoc) query = query.eq("namhoc", params.namhoc);

  return query;
}

export async function createHockyRepo(supabase: SupabaseClient, payload: Record<string, unknown>) {
  return supabase.from("hocky").insert(payload).select().single();
}

export async function updateHockyRepo(supabase: SupabaseClient, mahk: number, payload: Record<string, unknown>) {
  return supabase.from("hocky").update(payload).eq("mahocky", mahk).select().single();
}

export async function checkPhanCongForHockyRepo(supabase: SupabaseClient, mahk: number) {
  return supabase.from("phancong").select("*", { count: "exact", head: true }).eq("mahocky", mahk);
}

export async function deleteHockyRepo(supabase: SupabaseClient, mahk: number) {
  return supabase.from("hocky").delete().eq("mahocky", mahk);
}

export async function deactivateAllOtherHockyRepo(supabase: SupabaseClient, currentMahk: number) {
  return supabase.from("hocky").update({ danghieuluc: false }).neq("mahocky", currentMahk);
}

export async function activateHockyRepo(supabase: SupabaseClient, mahk: number) {
  return supabase.from("hocky").update({ danghieuluc: true }).eq("mahocky", mahk).select().single();
}
