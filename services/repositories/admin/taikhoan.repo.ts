import { SupabaseClient } from "@supabase/supabase-js";

export async function getTaiKhoanListRepo(
  supabase: SupabaseClient,
  params: { search?: string; vaitro?: string; trangthai?: string; from: number; to: number }
) {
  let query = supabase
    .from("taikhoan")
    .select("mataikhoan, email, vaitro, trangthai, dangnhaplancuoi", { count: "exact" });

  if (params.search) {
    query = query.or(`email.ilike.%${params.search}%,mataikhoan.ilike.%${params.search}%`);
  }
  if (params.vaitro) query = query.eq("vaitro", params.vaitro);
  if (params.trangthai) query = query.eq("trangthai", params.trangthai);

  return query
    .order("mataikhoan", { ascending: true })
    .range(params.from, params.to);
}

export async function hashPasswordRepo(supabase: SupabaseClient, password: string) {
  return supabase.rpc("hash_password", { password });
}

export async function updateTaiKhoanRepo(supabase: SupabaseClient, mataikhoan: string, payload: Record<string, any>) {
  return supabase
    .from("taikhoan")
    .update(payload)
    .eq("mataikhoan", mataikhoan)
    .select("mataikhoan, email, vaitro, trangthai, dangnhaplancuoi")
    .single();
}

export async function deleteTaiKhoanRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase.from("taikhoan").delete().eq("mataikhoan", mataikhoan);
}

export async function getTaiKhoanStatsRepo(supabase: SupabaseClient) {
  return supabase
    .from("taikhoan")
    .select("vaitro, trangthai");
}

export async function bulkUpdateTaiKhoanRepo(
  supabase: SupabaseClient,
  ids: string[],
  payload: Record<string, any>,
  adminRole: string
) {
  return supabase
    .from("taikhoan")
    .update(payload)
    .in("mataikhoan", ids)
    .neq("vaitro", adminRole)
    .select("mataikhoan, email, vaitro, trangthai");
}
