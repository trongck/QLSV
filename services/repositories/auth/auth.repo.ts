import { SupabaseClient } from "@supabase/supabase-js";

export async function getAccountByEmailOrIdRepo(supabase: SupabaseClient, email: string) {
  return supabase
    .from("taikhoan")
    .select("mataikhoan, email, vaitro, trangthai, matkhau")
    .or(`email.eq.${email.trim()},mataikhoan.eq.${email.trim()}`)
    .single();
}

export async function getAccountByIdRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase
    .from("taikhoan")
    .select("mataikhoan, email, vaitro, trangthai")
    .eq("mataikhoan", mataikhoan)
    .single();
}

export async function fetchProfileSinhVienRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase
    .from("sinhvien")
    .select("masv, hoten, anhdaidien")
    .eq("mataikhoan", mataikhoan)
    .single();
}

export async function fetchProfileGiangVienRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase
    .from("giangvien")
    .select("magv, hoten, anhdaidien")
    .eq("mataikhoan", mataikhoan)
    .single();
}

export async function fetchProfileAdminRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase
    .from("admin")
    .select("maadmin, hoten")
    .eq("mataikhoan", mataikhoan)
    .single();
}

export async function insertSessionRepo(supabase: SupabaseClient, payload: {
  mataikhoan: string;
  refreshtoken: string;
  diachiip: string | null;
  thoigianhethan: string;
}) {
  return supabase.from("phiendangnhap").insert(payload);
}

export async function updateLastLoginRepo(supabase: SupabaseClient, mataikhoan: string) {
  const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
  return supabase
    .from("taikhoan")
    .update({ dangnhaplancuoi: vnNow })
    .eq("mataikhoan", mataikhoan);
}

export async function deleteSessionRepo(supabase: SupabaseClient, refreshToken: string) {
  return supabase.from("phiendangnhap").delete().eq("refreshtoken", refreshToken);
}

export async function deleteAllSessionsRepo(supabase: SupabaseClient, mataikhoan: string) {
  return supabase.from("phiendangnhap").delete().eq("mataikhoan", mataikhoan);
}

export async function getSessionRepo(supabase: SupabaseClient, refreshToken: string) {
  return supabase
    .from("phiendangnhap")
    .select("maphien, mataikhoan, thoigianhethan")
    .eq("refreshtoken", refreshToken)
    .single();
}

export async function deleteSessionByIdRepo(supabase: SupabaseClient, maphien: number) {
  return supabase.from("phiendangnhap").delete().eq("maphien", maphien);
}

export async function updateSessionRepo(
  supabase: SupabaseClient,
  maphien: number,
  payload: { refreshtoken: string; diachiip: string | null; thoigianhethan: string }
) {
  return supabase.from("phiendangnhap").update(payload).eq("maphien", maphien);
}

// ─── Reset Password Request Repo ──────────────────────────────────────────────

export async function getSinhVienContactRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .select("masv, mataikhoan, ngaysinh, hoten")
    .eq("masv", masv)
    .single();
}

export async function getSinhVienDetailContactRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .select("sodienthoai, emailcanhan")
    .eq("masv", masv)
    .single();
}

export async function getGiangVienContactRepo(supabase: SupabaseClient, magv: string) {
  return supabase
    .from("giangvien")
    .select("magv, mataikhoan, ngaysinh, hoten")
    .eq("magv", magv)
    .single();
}

export async function getGiangVienDetailContactRepo(supabase: SupabaseClient, magv: string) {
  return supabase
    .from("giangvien")
    .select("sodienthoai, emailcanhan")
    .eq("magv", magv)
    .single();
}

export async function updateAccountPasswordRepo(supabase: SupabaseClient, mataikhoan: string, hashed: string) {
  return supabase
    .from("taikhoan")
    .update({ matkhau: hashed })
    .eq("mataikhoan", mataikhoan);
}

export async function logSystemActionRepo(supabase: SupabaseClient, log: {
  mataikhoan: string;
  hanhdong: string;
  tentable: string;
  makhoachinh: string;
  giatricu: any;
  giatrimoi: any;
  diachiip: string;
}) {
  return supabase.from("nhatkyhethong").insert(log);
}

export async function getResetPasswordLogsRepo(supabase: SupabaseClient) {
  return supabase
    .from("nhatkyhethong")
    .select(`
      manhatky,
      mataikhoan,
      hanhdong,
      tentable,
      makhoachinh,
      diachiip,
      ngaytao
    `)
    .or("hanhdong.ilike.%cấp lại mật khẩu%,hanhdong.ilike.%thay đổi mật khẩu%")
    .order("ngaytao", { ascending: false })
    .limit(100);
}
