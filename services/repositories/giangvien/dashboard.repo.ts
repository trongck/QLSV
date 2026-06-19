import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const dashboardRepo = {
  async getActivePhanCong(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select(`
        maphancong,
        monhoc ( tenmon ),
        lop ( tenlop )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true);
  },

  async getSinhVienMonHocCounts(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .in("maphancong", maphancongIds)
      .eq("trangthai", "Danghoc");
  },

  async getVThongKePhanCong(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("vthongke_phancong")
      .select("maphancong, diemtb")
      .in("maphancong", maphancongIds);
  },

  async getLichHocList(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("malichhoc, maphancong")
      .in("maphancong", maphancongIds);
  },

  async getBuoiHocList(malichhocIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .select("mabuoihoc, malichhoc")
      .in("malichhoc", malichhocIds);
  },

  async getDiemDanhList(mabuoihocIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .select("mabuoihoc, trangthai")
      .in("mabuoihoc", mabuoihocIds);
  },

  async getPendingTasksCount(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("baitap")
      .select("mabaitap", { count: "exact", head: true })
      .in("maphancong", maphancongIds)
      .gt("hannop", new Date().toISOString());
  },

  async getGiangVienMataikhoan(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("giangvien")
      .select("mataikhoan")
      .eq("magv", magv)
      .single();
  },

  async getThongBaoList(mataikhoantao: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .select("tieude, ngaytao")
      .eq("mataikhoantao", mataikhoantao)
      .order("ngaytao", { ascending: false })
      .limit(5);
  }
};
