import { SupabaseClient } from "@supabase/supabase-js";

export async function getPhanCongListRepo(
  supabase: SupabaseClient,
  params: {
    search?: string;
    magv?: string;
    mamon?: string;
    malop?: string;
    mahocky?: string;
    status?: "ongoing" | "ended" | "all";
    from?: number;
    to?: number;
    limit?: number;
  }
) {
  let query = supabase
    .from("phancong")
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky, ngaybatdau, ngayketthuc)", { count: "exact" });

  if (params.search) {
    query = query.or(`malophoc.ilike.%${params.search}%`);
  }
  if (params.magv) query = query.eq("magv", params.magv);
  if (params.mamon) query = query.eq("mamon", params.mamon);
  if (params.malop) query = query.eq("malop", params.malop);
  if (params.mahocky) query = query.eq("mahocky", parseInt(params.mahocky));
  
  const now = new Date().toISOString().split("T")[0];
  if (params.status === "ongoing") {
    query = query.or(`ngayketthuc.is.null,ngayketthuc.gte.${now}`);
  } else if (params.status === "ended") {
    query = query.lt("ngayketthuc", now);
  }

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
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky, ngaybatdau, ngayketthuc)")
    .single();
}

export async function updatePhanCongRepo(supabase: SupabaseClient, maphancong: number, payload: Record<string, any>) {
  return supabase
    .from("phancong")
    .update(payload)
    .eq("maphancong", maphancong)
    .select("*, giangvien:magv(hoten), monhoc:mamon(tenmon), lop:malop(tenlop), hocky:mahocky(tenhocky, ngaybatdau, ngayketthuc)")
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

export async function enrollStudentsFromClassRepo(supabase: SupabaseClient, maphancong: number, malop: string) {
  // 1. Get all students of the class
  const { data: students, error: studentsError } = await supabase
    .from("sinhvien")
    .select("masv")
    .eq("malop", malop);

  if (studentsError) throw studentsError;
  if (!students || students.length === 0) return { data: [], error: null };

  // 2. Insert into sinhvienmonhoc
  const enrollmentPayload = students.map((s) => ({
    masv: s.masv,
    maphancong: maphancong,
    trangthai: "Danghoc"
  }));

  return supabase
    .from("sinhvienmonhoc")
    .upsert(enrollmentPayload, { onConflict: "masv,maphancong" });
}

export async function clearSinhVienMonHocRepo(supabase: SupabaseClient, maphancong: number) {
  return supabase
    .from("sinhvienmonhoc")
    .delete()
    .eq("maphancong", maphancong);
}

