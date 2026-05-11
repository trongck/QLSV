import { SupabaseClient } from "@supabase/supabase-js";

export async function getPhanCongListRepo(
  supabase: SupabaseClient,
  params: {
    search?: string;
    magv?: string;
    mamon?: string;
    malop?: string;
    mahocky?: string;
    from?: number;
    to?: number;
    limit?: number;
  }
) {
  let query = supabase
    .from("phancong")
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)", { count: "exact" });

  if (params.search) {
    query = query.or(`malophoc.ilike.%${params.search}%`);
  }
  if (params.magv) query = query.eq("magv", params.magv);
  if (params.mamon) query = query.eq("mamon", params.mamon);
  if (params.malop) query = query.eq("malop", params.malop);
  if (params.mahocky) query = query.eq("mahocky", parseInt(params.mahocky));

  if (params.from !== undefined && params.to !== undefined) {
    query = query.order("maphancong", { ascending: false }).range(params.from, params.to);
  } else {
    query = query.order("maphancong", { ascending: false }).limit(params.limit ?? 50);
  }

  return query;
}

export async function checkDuplicatePhanCongRepo(
  supabase: SupabaseClient,
  params: { magv: string; mamon: string; malop: string; mahocky: number; malophoc?: string; excludeId?: number }
) {
  let query = supabase
    .from("phancong")
    .select("maphancong")
    .eq("magv", params.magv.trim())
    .eq("mamon", params.mamon.trim())
    .eq("malop", params.malop.trim())
    .eq("mahocky", params.mahocky);

  if (params.excludeId !== undefined) {
    query = query.neq("maphancong", params.excludeId);
  }

  if (params.malophoc?.trim()) {
    query = query.eq("malophoc", params.malophoc.trim());
  } else {
    query = query.is("malophoc", null);
  }

  return query;
}

export async function getMaxPhanCongIdRepo(supabase: SupabaseClient) {
  return supabase
    .from("phancong")
    .select("maphancong")
    .order("maphancong", { ascending: false })
    .limit(1);
}

export async function createPhanCongRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("phancong")
    .insert(payload)
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)")
    .single();
}

export async function updatePhanCongRepo(supabase: SupabaseClient, maphancong: number, payload: Record<string, any>) {
  return supabase
    .from("phancong")
    .update(payload)
    .eq("maphancong", maphancong)
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky)")
    .single();
}

export async function checkLichHocForPhanCongRepo(supabase: SupabaseClient, maphancong: number) {
  return supabase
    .from("lichhoc")
    .select("malichhoc")
    .eq("maphancong", maphancong)
    .limit(1);
}

export async function deletePhanCongRepo(supabase: SupabaseClient, maphancong: number) {
  return supabase
    .from("phancong")
    .delete()
    .eq("maphancong", maphancong);
}
