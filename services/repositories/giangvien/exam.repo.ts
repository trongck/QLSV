import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const examRepo = {
  async getExamCheck(madethi: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .select("madethi, phancong!inner(magv)")
      .eq("madethi", madethi)
      .single();
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

  async updateExamInfo(madethi: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .update(payload)
      .eq("madethi", madethi);
  },

  async deleteCauHoiByExam(madethi: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("cauhoi")
      .delete()
      .eq("madethi", madethi);
  },

  async insertCauHoi(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("cauhoi")
      .insert(payload)
      .select("macauhoi")
      .single();
  },

  async insertDapAnBatch(inserts: any[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dapan")
      .insert(inserts);
  },

  async getExamsPhanCong(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong, monhoc(tenmon), lop(tenlop)")
      .eq("magv", magv);
  },

  async getExamsList(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .select("*, cauhoi(*, dapan(*)), ketquathi(*)")
      .in("maphancong", maphancongIds)
      .order("thoigianbatdau", { ascending: false });
  },

  async getPhanCongList(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong")
      .eq("magv", magv);
  },

  async getExamCheckInPhanCong(madethi: number, maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .select("madethi")
      .eq("madethi", madethi)
      .in("maphancong", maphancongIds)
      .maybeSingle();
  },

  async endExam(madethi: number, timeStr: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .update({ thoigianketthuc: timeStr })
      .eq("madethi", madethi);
  },

  async createExam(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("dethi")
      .insert(payload)
      .select("madethi")
      .single();
  }
};
