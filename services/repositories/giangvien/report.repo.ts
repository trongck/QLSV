import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const reportRepo = {
  async checkPhanCongBelongsToTeacher(magv: string, maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv)
      .eq("maphancong", maphancong)
      .maybeSingle();
  },

  async getSinhVienMonHocList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select("masv")
      .eq("maphancong", maphancong);
  },

  async getDiemTongKetRows(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemtongket")
      .select("diemtongket, diemchu")
      .eq("maphancong", maphancong);
  },

  async getLichHocList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("malichhoc")
      .eq("maphancong", maphancong);
  },

  async getBuoiHocList(lichIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .select("mabuoihoc")
      .in("malichhoc", lichIds);
  },

  async getDiemDanhRows(buoiIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .select("trangthai")
      .in("mabuoihoc", buoiIds);
  },

  async getReportsList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .select("matailieu, tieude, mota, duongdan, ngaytao")
      .eq("maphancong", maphancong)
      .eq("loai", "File")
      .order("ngaytao", { ascending: false });
  },

  async createReport(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .insert(payload)
      .select()
      .single();
  },

  async getPhanCongList(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv);
  },

  async getTaiLieuCheck(matailieu: number, maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .select("matailieu")
      .eq("matailieu", matailieu)
      .in("maphancong", maphancongIds)
      .maybeSingle();
  },

  async updateReport(matailieu: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .update(payload)
      .eq("matailieu", matailieu);
  }
};
