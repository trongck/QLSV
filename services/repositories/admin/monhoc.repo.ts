import { SupabaseClient } from "@supabase/supabase-js";

export async function getMonhocListRepo(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; batbuoc?: string; from: number; to: number }
) {
  let query = supabase
    .from("monhoc")
    .select("*, khoa:makhoa(tenkhoa)", { count: "exact" })
    .order("ngaytao", { ascending: false })
    .range(params.from, params.to);

  if (params.search) {
    query = query.or(`tenmon.ilike.%${params.search}%,mamon.ilike.%${params.search}%`);
  }
  if (params.makhoa) {
    query = query.eq("makhoa", params.makhoa);
  }
  if (params.batbuoc !== "" && params.batbuoc !== undefined) {
    query = query.eq("batbuoc", params.batbuoc === "true");
  }

  return query;
}

export async function getMonhocStatsRepo(supabase: SupabaseClient) {
  const { count: countRequired } = await supabase
    .from("monhoc")
    .select("*", { count: "exact", head: true })
    .eq("batbuoc", true);

  const { count: countOptional } = await supabase
    .from("monhoc")
    .select("*", { count: "exact", head: true })
    .eq("batbuoc", false);

  const { count: totalAll } = await supabase
    .from("monhoc")
    .select("*", { count: "exact", head: true });

  return {
    countRequired: countRequired ?? 0,
    countOptional: countOptional ?? 0,
    totalAll: totalAll ?? 0,
  };
}

export async function createMonhocRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("monhoc")
    .insert(payload)
    .select("*, khoa:makhoa(tenkhoa)")
    .single();
}

export async function updateMonhocRepo(supabase: SupabaseClient, mamon: string, payload: Record<string, any>) {
  return supabase
    .from("monhoc")
    .update(payload)
    .eq("mamon", mamon)
    .select("*, khoa:makhoa(tenkhoa)")
    .single();
}

export async function checkPhanCongForMonhocRepo(supabase: SupabaseClient, mamon: string) {
  return supabase
    .from("phancong")
    .select("*", { count: "exact", head: true })
    .eq("mamon", mamon);
}

export async function deleteMonhocRepo(supabase: SupabaseClient, mamon: string) {
  return supabase
    .from("monhoc")
    .delete()
    .eq("mamon", mamon);
}
