import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const taskRepo = {
  async getTasksPhanCong(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong, monhoc(tenmon), lop(tenlop)")
      .eq("magv", magv);
  },

  async getSinhVienMonHocCounts(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .in("maphancong", maphancongIds)
      .eq("trangthai", "Danghoc");
  },

  async getBaiTapList(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("baitap")
      .select("*")
      .in("maphancong", maphancongIds)
      .order("ngaytao", { ascending: false });
  },

  async getNopBaiCounts(mabaitapIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("nopbai")
      .select("mabaitap")
      .in("mabaitap", mabaitapIds);
  },

  async updateTask(mabaitap: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("baitap")
      .update(payload)
      .eq("mabaitap", mabaitap);
  },

  async getTaskSubmissions(mabaitap: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("nopbai")
      .select(`
        manopbai,
        noidungnop,
        filenop,
        thoigiannop,
        masv,
        sinhvien:masv ( hodem, ten, malop )
      `)
      .eq("mabaitap", mabaitap)
      .order("thoigiannop", { ascending: false });
  },

  async checkPhanCongBelongsToTeacher(maphancong: number, magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong")
      .eq("maphancong", maphancong)
      .eq("magv", magv)
      .maybeSingle();
  },

  async createTask(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("baitap")
      .insert(payload)
      .select("mabaitap")
      .single();
  },

  async getGiangVienMataikhoan(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("giangvien")
      .select("mataikhoan")
      .eq("magv", magv)
      .single();
  },

  async createNotification(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .insert(payload);
  }
};
