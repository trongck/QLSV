import { SupabaseClient } from "@supabase/supabase-js";

export async function getSinhVienListRepo(
  supabase: SupabaseClient,
  params: { search?: string; malop?: string; trangthai?: string; from: number; to: number }
) {
  let query = supabase
    .from("sinhvien")
    .select(
      `masv, hoten, ngaysinh, gioitinh, emailtruong, trangthai, malop,
       sodienthoai, emailcanhan, cccd,
       lop(tenlop, makhoa, khoa(tenkhoa))`,
      { count: "exact" }
    )
    .order("masv", { ascending: true })
    .range(params.from, params.to);

  if (params.search) {
    query = query.or(`hoten.ilike.%${params.search}%,masv.ilike.%${params.search}%`);
  }
  if (params.malop) query = query.eq("malop", params.malop);
  if (params.trangthai) query = query.eq("trangthai", params.trangthai);

  return query;
}

export async function getSinhVienByIdRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .select(`*, lop(tenlop, makhoa, khoa(tenkhoa)), taikhoan(email, vaitro, trangthai)`)
    .eq("masv", masv)
    .single();
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

export async function createSinhVienRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("sinhvien")
    .insert(payload)
    .select()
    .single();
}

export async function updateSinhVienRepo(
  supabase: SupabaseClient,
  masv: string,
  payload: Record<string, any>
) {
  return supabase
    .from("sinhvien")
    .update(payload)
    .eq("masv", masv)
    .select()
    .single();
}


export async function getSinhVienMaTaiKhoanRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .select("mataikhoan")
    .eq("masv", masv)
    .single();
}

export async function deleteSinhVienRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .delete()
    .eq("masv", masv);
}

export async function deleteTaiKhoanRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase
    .from("taikhoan")
    .delete()
    .eq("mataikhoan", mataikhoan);
}

export async function validateImportPrefetchRepo(
  supabase: SupabaseClient,
  masvs: string[],
  emails: string[]
) {
  return Promise.all([
    supabase.from("sinhvien").select("masv").in("masv", masvs),
    supabase.from("taikhoan").select("email").in("email", emails),
    supabase.from("lop").select("malop, tenlop")
  ]);
}
