import { SupabaseClient } from "@supabase/supabase-js";
import { VaiTro, TrangThaiTaiKhoan } from "@/types";
import * as repo from "../../repositories/admin/taikhoan.repo";

export async function getTaiKhoanListService(
  supabase: SupabaseClient,
  params: { search?: string; vaitro?: string; trangthai?: string; page: number; limit: number }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getTaiKhoanListRepo(supabase, {
    search: params.search,
    vaitro: params.vaitro,
    trangthai: params.trangthai,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  return {
    data,
    total: count ?? 0,
  };
}

export async function updateTaiKhoanService(supabase: SupabaseClient, mataikhoan: string, body: any) {
  const { trangthai, matkhau } = body;

  const update: Record<string, unknown> = {};
  if (trangthai) update.trangthai = trangthai;

  if (matkhau?.trim()) {
    const { data: hashed, error: hashErr } = await repo.hashPasswordRepo(supabase, matkhau.trim());
    if (hashErr || !hashed) throw new Error("Lỗi mã hoá mật khẩu mới.");
    update.matkhau = hashed;
  }

  if (Object.keys(update).length === 0) throw new Error("Không có thông tin cập nhật.");

  const { data, error } = await repo.updateTaiKhoanRepo(supabase, mataikhoan, update);
  if (error) throw new Error(error.message);

  return data;
}

export async function deleteTaiKhoanService(supabase: SupabaseClient, mataikhoan: string) {
  const { error } = await repo.deleteTaiKhoanRepo(supabase, mataikhoan);
  if (error) throw new Error(error.message);
}

export async function getTaiKhoanStatsService(supabase: SupabaseClient) {
  const { data, error } = await repo.getTaiKhoanStatsRepo(supabase);
  if (error) throw new Error(error.message);

  return {
    total: data.length,
    admin: data.filter(r => r.vaitro === VaiTro.Admin).length,
    giangvien: data.filter(r => r.vaitro === VaiTro.GiangVien).length,
    sinhvien: data.filter(r => r.vaitro === VaiTro.SinhVien).length,
    hoatdong: data.filter(r => r.trangthai === TrangThaiTaiKhoan.HoatDong).length,
    khoa: data.filter(r => r.trangthai === TrangThaiTaiKhoan.Khoa).length,
  };
}

export async function bulkAccountActionService(
  supabase: SupabaseClient,
  ids: string[],
  action: "lock" | "unlock" | "reset",
  matkhau?: string
) {
  let update: Record<string, unknown> = {};

  if (action === "lock") update = { trangthai: TrangThaiTaiKhoan.Khoa };
  if (action === "unlock") update = { trangthai: TrangThaiTaiKhoan.HoatDong };
  if (action === "reset") {
    if (!matkhau || matkhau.trim().length < 6) {
      throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
    }
    const { data: hashed, error: hashErr } = await repo.hashPasswordRepo(supabase, matkhau.trim());
    if (hashErr || !hashed) throw new Error("Lỗi mã hoá mật khẩu mới.");
    update = { matkhau: hashed };
  }

  if (Object.keys(update).length === 0) throw new Error("Hành động không hợp lệ.");

  const { data, error } = await repo.bulkUpdateTaiKhoanRepo(supabase, ids, update, VaiTro.Admin);
  if (error) throw new Error(error.message);

  return {
    affected: data?.length ?? 0,
    data,
  };
}
