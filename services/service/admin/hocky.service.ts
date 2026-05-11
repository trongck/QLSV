import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/hocky.repo";

export async function getHockyListService(
  supabase: SupabaseClient,
  params: { search?: string; namhoc?: number }
) {
  const { data, count, error } = await repo.getHockyListRepo(supabase, params);
  if (error) throw new Error(error.message);
  return { data, total: count ?? 0 };
}

export async function createHockyService(supabase: SupabaseClient, body: any) {
  const { tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc } = body;
  const { data, error } = await repo.createHockyRepo(supabase, {
    tenhocky: tenhocky.trim(),
    namhoc: Number(namhoc),
    ky: Number(ky),
    ngaybatdau: ngaybatdau || null,
    ngayketthuc: ngayketthuc || null,
    danghieuluc: danghieuluc ?? false
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateHockyService(supabase: SupabaseClient, mahk: number, body: any) {
  const { tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc } = body;
  const { data, error } = await repo.updateHockyRepo(supabase, mahk, {
    tenhocky: tenhocky.trim(),
    namhoc: Number(namhoc),
    ky: Number(ky),
    ngaybatdau: ngaybatdau || null,
    ngayketthuc: ngayketthuc || null,
    danghieuluc: Boolean(danghieuluc)
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteHockyService(supabase: SupabaseClient, mahk: number) {
  const { count } = await repo.checkPhanCongForHockyRepo(supabase, mahk);
  if (count && count > 0) {
    throw new Error("Học kỳ đang có phân công, không thể xoá.");
  }

  const { error } = await repo.deleteHockyRepo(supabase, mahk);
  if (error) throw new Error(error.message);
}

export async function activateHockyService(supabase: SupabaseClient, mahk: number) {
  await repo.deactivateAllOtherHockyRepo(supabase, mahk);
  const { data, error } = await repo.activateHockyRepo(supabase, mahk);
  if (error) throw new Error(error.message);
  return data;
}
