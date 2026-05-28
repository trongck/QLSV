import { SupabaseClient } from "@supabase/supabase-js";

export async function getSinhVienDetailForStatsRepo(supabase: SupabaseClient, masv: string) {
  return supabase
    .from("sinhvien")
    .select(`
      masv,
      hodem,
      ten,
      ngaysinh,
      gioitinh,
      emailtruong,
      trangthai,
      malop,
      sodienthoai,
      emailcanhan,
      diachithuongtru,
      tenphuhuynh,
      sodienthoaiphuhuynh,
      cccd,
      ngaycapcccd,
      noicapcccd,
      dantoc,
      tongiao,
      lop(tenlop, makhoa, khoa(tenkhoa))
    `)
    .eq("masv", masv)
    .single();
}

export async function getGiangVienDetailForStatsRepo(supabase: SupabaseClient, magv: string) {
  return supabase
    .from("giangvien")
    .select(`
      magv,
      hodem,
      ten,
      ngaysinh,
      gioitinh,
      hocvi,
      chuyennganh,
      emailtruong,
      makhoa,
      sodienthoai,
      emailcanhan,
      diachi,
      ngayvaotruong,
      hesoluong,
      khoa(tenkhoa)
    `)
    .eq("magv", magv)
    .single();
}

export async function logSystemActionRepo(supabase: SupabaseClient, payload: {
  mataikhoan: string;
  hanhdong: string;
  tentable?: string;
  makhoachinh?: string;
  diachiip: string;
}) {
  return supabase.from("nhatkyhethong").insert(payload);
}

export async function globalSearchRepo(supabase: SupabaseClient, search: string) {
  return Promise.all([
    supabase
      .from("sinhvien")
      .select("masv, hodem, ten, trangthai, lop(tenlop)")
      .or(`ten.ilike.%${search}%,masv.ilike.%${search}%`)
      .limit(10),
    supabase
      .from("giangvien")
      .select("magv, hodem, ten, hocvi, khoa(tenkhoa)")
      .or(`ten.ilike.%${search}%,magv.ilike.%${search}%`)
      .limit(10),
    supabase
      .from("lop")
      .select("malop, tenlop, khoa(tenkhoa), sinhvien(count)")
      .or(`tenlop.ilike.%${search}%,malop.ilike.%${search}%`)
      .limit(10),
    supabase
      .from("monhoc")
      .select("mamon, tenmon, sotinchi, khoa(tenkhoa)")
      .or(`tenmon.ilike.%${search}%,mamon.ilike.%${search}%`)
      .limit(10)
  ]);
}

export async function getCountsRepo(supabase: SupabaseClient) {
  return Promise.all([
    supabase.from("sinhvien").select("masv", { count: "exact", head: true }),
    supabase.from("giangvien").select("magv", { count: "exact", head: true }),
    supabase.from("lop").select("malop", { count: "exact", head: true }),
    supabase.from("khoa").select("makhoa", { count: "exact", head: true })
  ]);
}

export async function getRecentSVRepo(supabase: SupabaseClient, limit: number) {
  return supabase
    .from("sinhvien")
    .select("masv, hodem, ten, trangthai, lop(tenlop)")
    .order("masv", { ascending: false })
    .limit(limit);
}

export async function getRecentGVRepo(supabase: SupabaseClient, limit: number) {
  return supabase
    .from("giangvien")
    .select("magv, hodem, ten, hocvi, khoa(tenkhoa)")
    .order("magv", { ascending: false })
    .limit(limit);
}

export async function getTodaySchedulesRepo(supabase: SupabaseClient, thuTrongTuan: number) {
  const now = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split("T")[0];

  return supabase
    .from("lichhoc")
    .select(`
      malichhoc,
      thutrongtuan,
      tietbatdau,
      tietketthuc,
      maphong,
      ghichu,
      phonghoc(maphong, loaiphong, suchua),
      phancong!inner(
        maphancong,
        magv,
        mamon,
        malop,
        danghieuluc,
        giangvien:magv(hodem, ten),
        monhoc:mamon(tenmon),
        lop:malop(tenlop),
        hocky:mahocky!inner(
          mahocky,
          tenhocky,
          danghieuluc,
          ngaybatdau,
          ngayketthuc
        )
      )
    `)
    .eq("thutrongtuan", thuTrongTuan)
    .eq("phancong.danghieuluc", true)
    .eq("phancong.hocky.danghieuluc", true)
    .or(`ngayketthuc.is.null,ngayketthuc.gte.${now}`, { foreignTable: "phancong" })
    .order("tietbatdau", { ascending: true });
}

export async function getAuditLogsRepo(supabase: SupabaseClient, limit: number) {
  return supabase
    .from("nhatkyhethong")
    .select(`
      manhatky,
      mataikhoan,
      hanhdong,
      tentable,
      makhoachinh,
      diachiip,
      ngaytao,
      taikhoan:mataikhoan(email, vaitro)
    `)
    .order("ngaytao", { ascending: false })
    .limit(limit);
}
