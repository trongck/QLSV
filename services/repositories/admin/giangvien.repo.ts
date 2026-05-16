import { SupabaseClient } from "@supabase/supabase-js";

export async function getGiangVienListRepo(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; from: number; to: number }
) {
  let query = supabase
    .from("giangvien")
    .select(
      `magv, hoten, ngaysinh, gioitinh, hocvi, chuyennganh, emailtruong, makhoa, thanhtuu,
       khoa(tenkhoa),
       chitietgiangvien(sodienthoai, emailcanhan, ngayvaotruong, hesoluong)`,
      { count: "exact" }
    )
    .order("magv", { ascending: true })
    .range(params.from, params.to);

  if (params.search) {
    query = query.or(`hoten.ilike.%${params.search}%,magv.ilike.%${params.search}%`);
  }
  if (params.makhoa) {
    query = query.eq("makhoa", params.makhoa);
  }

  return query;
}

export async function hashPasswordRepo(supabase: SupabaseClient, password: string) {
  return supabase.rpc("hash_password", { password });
}

export async function createTaiKhoanRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("taikhoan")
    .insert(payload)
    .select("mataikhoan")
    .single();
}

export async function createGiangVienRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("giangvien")
    .insert(payload)
    .select()
    .single();
}

export async function insertChiTietGiangVienRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase.from("chitietgiangvien").insert(payload);
}

export async function getGiangVienByIdRepo(supabase: SupabaseClient, magv: string) {
  return supabase
    .from("giangvien")
    .select(`*, khoa(tenkhoa), chitietgiangvien(*), taikhoan(email, vaitro, trangthai)`)
    .eq("magv", magv)
    .single();
}

export async function updateGiangVienRepo(supabase: SupabaseClient, magv: string, payload: Record<string, any>) {
  return supabase
    .from("giangvien")
    .update(payload)
    .eq("magv", magv)
    .select()
    .single();
}

export async function upsertChiTietGiangVienRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase.from("chitietgiangvien").upsert(payload);
}

export async function deleteGiangVienRepo(supabase: SupabaseClient, magv: string) {
  return supabase.from("giangvien").delete().eq("magv", magv);
}

export async function deleteTaiKhoanRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase.from("taikhoan").delete().eq("mataikhoan", mataikhoan);
}
