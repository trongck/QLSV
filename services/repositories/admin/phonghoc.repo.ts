import { SupabaseClient } from "@supabase/supabase-js";

export async function getPhongHocListRepo(supabase: SupabaseClient) {
  return supabase
    .from("phonghoc")
    .select("maphong, loaiphong, suchua")
    .order("maphong", { ascending: true });
}

export async function getPhongHocByCodeRepo(supabase: SupabaseClient, maphong: string) {
  return supabase
    .from("phonghoc")
    .select("maphong, loaiphong, suchua")
    .eq("maphong", maphong)
    .maybeSingle();
}

export async function createPhongHocRepo(
  supabase: SupabaseClient,
  payload: { maphong: string; loaiphong: string; suchua: number }
) {
  return supabase
    .from("phonghoc")
    .insert(payload)
    .select()
    .single();
}

export async function updatePhongHocRepo(
  supabase: SupabaseClient,
  maphong: string,
  payload: { loaiphong: string; suchua: number }
) {
  return supabase
    .from("phonghoc")
    .update(payload)
    .eq("maphong", maphong)
    .select()
    .single();
}

export async function deletePhongHocRepo(supabase: SupabaseClient, maphong: string) {
  return supabase
    .from("phonghoc")
    .delete()
    .eq("maphong", maphong);
}

/** Check if classroom has any schedule assignments to prevent safe deletion */
export async function checkPhongHocHasSchedulesRepo(supabase: SupabaseClient, maphong: string) {
  return supabase
    .from("lichhoc")
    .select("malichhoc", { count: "exact", head: true })
    .eq("maphong", maphong);
}

/** Get schedules/timetable for a specific room */
export async function getPhongHocSchedulesRepo(supabase: SupabaseClient, maphong: string) {
  return supabase
    .from("lichhoc")
    .select(`
      malichhoc,
      thutrongtuan,
      tietbatdau,
      tietketthuc,
      ghichu,
      phancong!inner(
        danghieuluc,
        giangvien:magv(hoten),
        monhoc:mamon(tenmon),
        lop:malop(tenlop),
        hocky:mahocky(tenhocky, danghieuluc)
      )
    `)
    .eq("maphong", maphong)
    .eq("phancong.danghieuluc", true)
    .eq("phancong.hocky.danghieuluc", true);
}

/** Check if there are any conflicting schedules in the same room for scheduling validation */
export async function checkPhongHocConflictRepo(
  supabase: SupabaseClient,
  maphong: string,
  thutrongtuan: number,
  tietbatdau: number,
  tietketthuc: number,
  excludeLichHocId?: number
) {
  let query = supabase
    .from("lichhoc")
    .select(`
      malichhoc,
      thutrongtuan,
      tietbatdau,
      tietketthuc,
      phancong!inner(
        danghieuluc,
        monhoc:mamon(tenmon),
        lop:malop(tenlop),
        hocky:mahocky(danghieuluc)
      )
    `)
    .eq("maphong", maphong)
    .eq("thutrongtuan", thutrongtuan)
    .eq("phancong.danghieuluc", true)
    .eq("phancong.hocky.danghieuluc", true);

  if (excludeLichHocId) {
    query = query.neq("malichhoc", excludeLichHocId);
  }

  const { data, error } = await query;
  if (error) return { data: null, error };

  // Check for session/period overlap
  const conflict = data.filter((lh: any) => {
    return (
      (tietbatdau >= lh.tietbatdau && tietbatdau <= lh.tietketthuc) ||
      (tietketthuc >= lh.tietbatdau && tietketthuc <= lh.tietketthuc) ||
      (lh.tietbatdau >= tietbatdau && lh.tietbatdau <= tietketthuc)
    );
  });

  return { data: conflict, error: null };
}

/** Advanced classroom usage stats */
export async function getRoomUtilizationStatsRepo(supabase: SupabaseClient) {
  return supabase
    .from("lichhoc")
    .select(`
      maphong,
      tietbatdau,
      tietketthuc,
      phancong!inner(
        danghieuluc,
        hocky:mahocky(danghieuluc)
      )
    `)
    .eq("phancong.danghieuluc", true)
    .eq("phancong.hocky.danghieuluc", true);
}
