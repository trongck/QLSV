import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const profileRepo = {
  async getProfileByMataikhoan(mataikhoan: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("giangvien")
      .select(`
        magv,
        mataikhoan,
        makhoa,
        hodem,
        ten,
        ngaysinh,
        gioitinh,
        hocvi,
        chuyennganh,
        anhdaidien,
        emailtruong,
        thanhtuu,
        diachi,
        sodienthoai,
        emailcanhan,
        ngayvaotruong,
        hesoluong
      `)
      .eq("mataikhoan", mataikhoan)
      .single();
  },

  async updateProfile(mataikhoan: string, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("giangvien")
      .update(payload)
      .eq("mataikhoan", mataikhoan);
  },

  async updateTaikhoanEmail(mataikhoan: string, email: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("taikhoan")
      .update({ email })
      .eq("mataikhoan", mataikhoan);
  }
};
