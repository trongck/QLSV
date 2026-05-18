import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/giangvien.repo";

export function mapGiangVien(gv: any) {
  if (!gv) return gv;
  return {
    ...gv,
    hoten: [gv.hodem, gv.ten].filter(Boolean).join(" ") || "Chưa thiết lập",
  };
}

export async function getGiangVienListService(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; page: number; limit: number }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getGiangVienListRepo(supabase, {
    search: params.search,
    makhoa: params.makhoa,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapGiangVien),
    total: count ?? 0,
  };
}

export async function createGiangVienService(supabase: SupabaseClient, body: any) {
  const { magv, makhoa, hoten, hodem, ten, ngaysinh, gioitinh, hocvi, chuyennganh, emailtruong, email, matkhau, chiTiet } = body;

  // 1. Hash password
  const { data: hashed, error: hashErr } = await repo.hashPasswordRepo(supabase, matkhau);
  if (hashErr) throw new Error("Lỗi hash mật khẩu.");

  // 2. Insert account
  const { data: tk, error: tkErr } = await repo.createTaiKhoanRepo(supabase, {
    mataikhoan: magv.trim(),
    email: email.trim(),
    matkhau: hashed,
    vaitro: "GiangVien",
    trangthai: "HoatDong",
  });
  if (tkErr) throw new Error("Không thể tạo tài khoản: " + tkErr.message);

  // Legacy fallback: split hoten if hodem and ten are missing
  let parsedHodem = hodem ? hodem.trim() : "";
  let parsedTen = ten ? ten.trim() : "";
  if (!parsedHodem && !parsedTen && hoten) {
    const parts = hoten.trim().split(" ");
    if (parts.length > 1) {
      parsedTen = parts.pop() || "";
      parsedHodem = parts.join(" ");
    } else {
      parsedTen = parts[0] || "";
      parsedHodem = "";
    }
  }

  // 3. Create giangvien with merged chiTiet fields
  const { data: gv, error: gvErr } = await repo.createGiangVienRepo(supabase, {
    magv: magv.trim(),
    makhoa: makhoa || null,
    hodem: parsedHodem || null,
    ten: parsedTen || null,
    ngaysinh: ngaysinh || null,
    gioitinh: gioitinh || null,
    hocvi: hocvi || null,
    chuyennganh: chuyennganh || null,
    emailtruong: emailtruong || null,
    mataikhoan: tk.mataikhoan,
    // Merge chitietgiangvien fields directly
    ...(chiTiet ?? {}),
  });

  if (gvErr) {
    await repo.deleteTaiKhoanRepo(supabase, tk.mataikhoan);
    throw new Error(gvErr.message);
  }

  return mapGiangVien(gv);
}

export async function getGiangVienByIdService(supabase: SupabaseClient, magv: string) {
  const { data, error } = await repo.getGiangVienByIdRepo(supabase, magv);
  if (error) throw new Error(error.message);
  return mapGiangVien(data);
}

export async function updateGiangVienService(supabase: SupabaseClient, magv: string, body: any) {
  const { hoten, hodem, ten, ngaysinh, gioitinh, makhoa, hocvi, chuyennganh, emailtruong, chiTiet } = body;

  const update: Record<string, unknown> = {};

  if (hodem !== undefined) update.hodem = hodem ? hodem.trim() : null;
  if (ten !== undefined) update.ten = ten ? ten.trim() : null;

  // Legacy fallback
  if (hoten && update.hodem === undefined && update.ten === undefined) {
    const parts = hoten.trim().split(" ");
    if (parts.length > 1) {
      update.ten = parts.pop() || "";
      update.hodem = parts.join(" ");
    } else {
      update.ten = parts[0] || "";
      update.hodem = "";
    }
  }

  if (ngaysinh !== undefined) update.ngaysinh = ngaysinh || null;
  if (gioitinh !== undefined) update.gioitinh = gioitinh || null;
  if (makhoa !== undefined) update.makhoa = makhoa || null;
  if (hocvi !== undefined) update.hocvi = hocvi || null;
  if (chuyennganh !== undefined) update.chuyennganh = chuyennganh || null;
  if (emailtruong !== undefined) update.emailtruong = emailtruong || null;
  // Merge chitietgiangvien fields directly if provided
  if (chiTiet) Object.assign(update, chiTiet);

  const { data, error } = await repo.updateGiangVienRepo(supabase, magv, update);
  if (error) throw new Error(error.message);

  return mapGiangVien(data);
}

export async function deleteGiangVienService(supabase: SupabaseClient, magv: string) {
  // Get mataikhoan first
  const { data: gv } = await repo.getGiangVienByIdRepo(supabase, magv);

  const { error } = await repo.deleteGiangVienRepo(supabase, magv);
  if (error) throw new Error(error.message);

  if (gv?.mataikhoan) {
    await repo.deleteTaiKhoanRepo(supabase, gv.mataikhoan);
  }
}
