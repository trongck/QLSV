import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/phancong.repo";

export async function getPhanCongListService(
  supabase: SupabaseClient,
  params: {
    search?: string;
    magv?: string;
    mamon?: string;
    malop?: string;
    mahocky?: string;
    page?: number;
    limit?: number;
  }
) {
  const page = params.page ? Math.max(1, params.page) : undefined;
  const limit = params.limit ?? 50;

  let from: number | undefined;
  let to: number | undefined;

  if (page !== undefined) {
    from = (page - 1) * limit;
    to = from + limit - 1;
  }

  const { data, count, error } = await repo.getPhanCongListRepo(supabase, {
    search: params.search,
    magv: params.magv,
    mamon: params.mamon,
    malop: params.malop,
    mahocky: params.mahocky,
    from,
    to,
    limit,
  });

  if (error) throw new Error(error.message);

  return {
    data,
    total: count ?? 0,
  };
}

export async function createPhanCongService(supabase: SupabaseClient, body: any) {
  const { magv, mamon, malop, mahocky, malophoc, sisomax, danghieuluc } = body;

  // 1. Check duplicate
  const { data: duplicateData, error: duplicateError } = await repo.checkDuplicatePhanCongRepo(supabase, {
    magv,
    mamon,
    malop,
    mahocky: parseInt(mahocky),
    malophoc,
  });

  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicateData && duplicateData.length > 0) {
    throw new Error("Phân công này đã tồn tại trong hệ thống.");
  }

  // 2. Max ID sequences
  const { data: maxPc } = await repo.getMaxPhanCongIdRepo(supabase);
  const nextId = maxPc && maxPc.length > 0 ? maxPc[0].maphancong + 1 : 1;

  // 3. Create phancong
  const { data, error } = await repo.createPhanCongRepo(supabase, {
    maphancong: nextId,
    magv: magv.trim(),
    mamon: mamon.trim(),
    malop: malop.trim(),
    mahocky: parseInt(mahocky),
    malophoc: malophoc?.trim() || null,
    sisomax: sisomax ? parseInt(sisomax) : null,
    danghieuluc: danghieuluc ?? true,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePhanCongService(supabase: SupabaseClient, maphancong: number, body: any) {
  const { magv, mamon, malop, mahocky, malophoc, sisomax, danghieuluc } = body;

  // 1. Check duplicate
  const { data: duplicateData, error: duplicateError } = await repo.checkDuplicatePhanCongRepo(supabase, {
    magv,
    mamon,
    malop,
    mahocky: parseInt(mahocky),
    malophoc,
    excludeId: maphancong,
  });

  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicateData && duplicateData.length > 0) {
    throw new Error("Phân công trùng lặp với một phân công khác đang tồn tại.");
  }

  // 2. Update phancong
  const { data, error } = await repo.updatePhanCongRepo(supabase, maphancong, {
    magv: magv.trim(),
    mamon: mamon.trim(),
    malop: malop.trim(),
    mahocky: parseInt(mahocky),
    malophoc: malophoc?.trim() || null,
    sisomax: sisomax ? parseInt(sisomax) : null,
    danghieuluc: danghieuluc ?? true,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePhanCongService(supabase: SupabaseClient, maphancong: number) {
  // 1. Check schedule links
  const { data: scheduleCheck, error: scheduleCheckError } = await repo.checkLichHocForPhanCongRepo(supabase, maphancong);
  if (scheduleCheckError) throw new Error(scheduleCheckError.message);
  if (scheduleCheck && scheduleCheck.length > 0) {
    throw new Error("Không thể xoá phân công này vì đang có lịch học đi kèm. Hãy xoá lịch học trước.");
  }

  // 2. Delete phancong
  const { error } = await repo.deletePhanCongRepo(supabase, maphancong);
  if (error) throw new Error(error.message);
}
