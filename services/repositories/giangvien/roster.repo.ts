import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const rosterRepo = {
  async getRosterStudents(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien:masv (
          mataikhoan,
          hodem,
          ten,
          malop,
          emailtruong,
          sodienthoai,
          emailcanhan,
          tenphuhuynh,
          sodienthoaiphuhuynh,
          diachitamtru,
          diachithuongtru
        )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");
  },

  async updateRosterStudent(masv: string, updatePayload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvien")
      .update(updatePayload)
      .eq("masv", masv);
  }
};
