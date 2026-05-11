import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/monhoc.repo";

export async function getMonhocListService(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; batbuoc?: string; page: number; limit: number }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getMonhocListRepo(supabase, {
    search: params.search,
    makhoa: params.makhoa,
    batbuoc: params.batbuoc,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  const stats = await repo.getMonhocStatsRepo(supabase);

  return {
    data,
    total: count ?? 0,
    stats,
  };
}

export async function createMonhocService(supabase: SupabaseClient, body: any) {
  const { mamon, tenmon, sotinchi, sotietlythuyet, sotietthuchanh, mota, batbuoc, makhoa } = body;

  const { data, error } = await repo.createMonhocRepo(supabase, {
    mamon: mamon.trim().toUpperCase(),
    tenmon: tenmon.trim(),
    sotinchi: Number(sotinchi),
    sotietlythuyet: sotietlythuyet ? Number(sotietlythuyet) : null,
    sotietthuchanh: sotietthuchanh ? Number(sotietthuchanh) : null,
    mota: mota?.trim() || null,
    batbuoc: Boolean(batbuoc),
    makhoa: makhoa || null,
  });

  if (error) {
    if (error.code === "23505") throw new Error("Mã môn đã tồn tại.");
    throw new Error(error.message);
  }

  return data;
}

export async function updateMonhocService(supabase: SupabaseClient, mamon: string, body: any) {
  const { tenmon, sotinchi, sotietlythuyet, sotietthuchanh, mota, batbuoc, makhoa } = body;

  const { data, error } = await repo.updateMonhocRepo(supabase, mamon, {
    tenmon: tenmon.trim(),
    sotinchi: Number(sotinchi),
    sotietlythuyet: sotietlythuyet ? Number(sotietlythuyet) : null,
    sotietthuchanh: sotietthuchanh ? Number(sotietthuchanh) : null,
    mota: mota?.trim() || null,
    batbuoc: Boolean(batbuoc),
    makhoa: makhoa || null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteMonhocService(supabase: SupabaseClient, mamon: string) {
  const { count } = await repo.checkPhanCongForMonhocRepo(supabase, mamon);
  if (count && count > 0) {
    throw new Error("Môn học đang có phân công, không thể xoá.");
  }

  const { error } = await repo.deleteMonhocRepo(supabase, mamon);
  if (error) throw new Error(error.message);
}
