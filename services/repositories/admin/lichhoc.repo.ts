import { SupabaseClient } from "@supabase/supabase-js";

export async function getLichHocListRepo(
  supabase: SupabaseClient,
  params: {
    maphancong?: string;
    thutrongtuan?: string;
    magv?: string;
    malop?: string;
    mahocky?: string;
    maphong?: string;
    from: number;
    to: number;
    limit: number;
    hasPage: boolean;
    status?: "ongoing" | "ended" | "all";
  }
) {
  const useInnerJoin = !!(params.magv || params.malop || params.mahocky);
  const relationString = useInnerJoin
    ? "*, phonghoc(maphong, loaiphong, suchua), phancong!inner(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))"
    : "*, phonghoc(maphong, loaiphong, suchua), phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))";

  let query = supabase.from("lichhoc").select(relationString, { count: "exact" });

  if (params.maphancong) query = query.eq("maphancong", parseInt(params.maphancong));
  if (params.thutrongtuan) query = query.eq("thutrongtuan", parseInt(params.thutrongtuan));
  if (params.maphong) query = query.eq("maphong", params.maphong);

  if (params.magv) query = query.eq("phancong.magv", params.magv);
  if (params.malop) query = query.eq("phancong.malop", params.malop);
  if (params.mahocky) query = query.eq("phancong.mahocky", parseInt(params.mahocky));
  
  const now = new Date().toISOString().split("T")[0];
  if (params.status === "ongoing") {
    query = query.or(`ngayketthuc.is.null,ngayketthuc.gte.${now}`, { foreignTable: "phancong" });
  } else if (params.status === "ended") {
    query = query.lt("phancong.ngayketthuc", now);
  }

  if (params.hasPage) {
    query = query
      .order("thutrongtuan", { ascending: true })
      .order("tietbatdau", { ascending: true })
      .range(params.from, params.to);
  } else {
    query = query
      .order("thutrongtuan", { ascending: true })
      .order("tietbatdau", { ascending: true })
      .limit(params.limit);
  }

  return query;
}

export async function getPhanCongDetailRepo(supabase: SupabaseClient, maphancong: number) {
  return supabase
    .from("phancong")
    .select("mahocky, magv, malop, monhoc:mamon(tenmon)")
    .eq("maphancong", maphancong)
    .single();
}

export async function getTeacherConflictsRepo(
  supabase: SupabaseClient,
  magv: string,
  mahocky: number,
  thu: number,
  excludeScheduleId?: number
) {
  let query = supabase
    .from("lichhoc")
    .select("*, phancong!inner(magv, mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
    .eq("phancong.magv", magv)
    .eq("phancong.mahocky", mahocky)
    .eq("thutrongtuan", thu);

  if (excludeScheduleId !== undefined) {
    query = query.neq("malichhoc", excludeScheduleId);
  }

  return query;
}

export async function getClassConflictsRepo(
  supabase: SupabaseClient,
  malop: string,
  mahocky: number,
  thu: number,
  excludeScheduleId?: number
) {
  let query = supabase
    .from("lichhoc")
    .select("*, phancong!inner(malop, mahocky, monhoc:mamon(tenmon), giangvien:magv(hoten))")
    .eq("phancong.malop", malop)
    .eq("phancong.mahocky", mahocky)
    .eq("thutrongtuan", thu);

  if (excludeScheduleId !== undefined) {
    query = query.neq("malichhoc", excludeScheduleId);
  }

  return query;
}

export async function getRoomTypeRepo(supabase: SupabaseClient, maphong: string) {
  return supabase
    .from("phonghoc")
    .select("loaiphong")
    .eq("maphong", maphong)
    .single();
}

export async function getRoomConflictsRepo(
  supabase: SupabaseClient,
  maphong: string,
  mahocky: number,
  thu: number,
  excludeScheduleId?: number
) {
  let query = supabase
    .from("lichhoc")
    .select("*, phancong!inner(mahocky, monhoc:mamon(tenmon), lop:malop(tenlop))")
    .eq("maphong", maphong)
    .eq("phancong.mahocky", mahocky)
    .eq("thutrongtuan", thu);

  if (excludeScheduleId !== undefined) {
    query = query.neq("malichhoc", excludeScheduleId);
  }

  return query;
}

export async function getMaxLichHocIdRepo(supabase: SupabaseClient) {
  return supabase
    .from("lichhoc")
    .select("malichhoc")
    .order("malichhoc", { ascending: false })
    .limit(1);
}

export async function createLichHocRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("lichhoc")
    .insert(payload)
    .select("*, phonghoc(maphong, loaiphong, suchua), phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))")
    .single();
}

export async function updateLichHocRepo(supabase: SupabaseClient, malichhoc: number, payload: Record<string, any>) {
  return supabase
    .from("lichhoc")
    .update(payload)
    .eq("malichhoc", malichhoc)
    .select("*, phonghoc(maphong, loaiphong, suchua), phancong(*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky))")
    .single();
}

export async function checkDependentSessionsRepo(supabase: SupabaseClient, malichhoc: number) {
  return supabase
    .from("buoihoc")
    .select("mabuoihoc")
    .eq("malichhoc", malichhoc)
    .limit(1);
}

export async function deleteLichHocRepo(supabase: SupabaseClient, malichhoc: number) {
  return supabase
    .from("lichhoc")
    .delete()
    .eq("malichhoc", malichhoc);
}
