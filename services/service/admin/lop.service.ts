import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/lop.repo";

export async function getLopListService(
  supabase: SupabaseClient,
  params: { search?: string; makhoa?: string; page: number; limit: number }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getLopListRepo(supabase, {
    search: params.search,
    makhoa: params.makhoa,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  return { data, count: count ?? 0 };
}

export async function createLopService(supabase: SupabaseClient, body: any) {
  const { malop, tenlop, makhoa, nganh, khoahoc, magv } = body;
  const { data, error } = await repo.createLopRepo(supabase, {
    malop: malop.trim(),
    tenlop: tenlop.trim(),
    makhoa: makhoa || null,
    nganh: nganh || null,
    khoahoc: khoahoc || null,
    magv: magv || null,
    siso: 0,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLopService(supabase: SupabaseClient, malop: string, body: any) {
  const { tenlop, makhoa, nganh, khoahoc, magv } = body;
  const { data, error } = await repo.updateLopRepo(supabase, malop, {
    tenlop: tenlop.trim(),
    makhoa: makhoa || null,
    nganh: nganh || null,
    khoahoc: khoahoc || null,
    magv: magv || null,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLopService(supabase: SupabaseClient, malop: string) {
  const { error } = await repo.deleteLopRepo(supabase, malop);
  if (error) throw new Error(error.message);
}
