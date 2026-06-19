import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const notificationRepo = {
  async getNotificationsList(search: string, loai: string, mataikhoan: string) {
    const supabase = await getSupabaseClient();
    let query = supabase
      .from("thongbao")
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .or(`doituong.eq.Tatca,doituong.eq.GiangVien,mataikhoantao.eq.${mataikhoan}`);

    if (search) {
      query = query.ilike("tieude", `%${search}%`);
    }
    if (loai) {
      query = query.eq("loai", loai);
    }

    return await query
      .order("ghim", { ascending: false })
      .order("ngaytao", { ascending: false });
  },

  async getDaDocThongBao(mataikhoan: string, mathongbaoIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .select("mathongbao, dadoc, thoigiandoc")
      .eq("mataikhoan", mataikhoan)
      .in("mathongbao", mathongbaoIds);
  },

  async createNotification(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .insert(payload)
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .single();
  },

  async getAllTeacherNotificationIds() {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .select("mathongbao")
      .or(`doituong.eq.Tatca,doituong.eq.GiangVien`);
  },

  async deleteDaDocThongBaoBatch(mataikhoan: string, mathongbaoIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .delete()
      .eq("mataikhoan", mataikhoan)
      .in("mathongbao", mathongbaoIds);
  },

  async insertDaDocThongBaoBatch(rows: any[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .insert(rows);
  },

  async deleteDaDocThongBaoSingle(mathongbao: number, mataikhoan: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .delete()
      .eq("mathongbao", mathongbao)
      .eq("mataikhoan", mataikhoan);
  },

  async insertDaDocThongBaoSingle(row: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .insert(row);
  },

  async getNotificationById(mathongbao: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .select("mataikhoantao")
      .eq("mathongbao", mathongbao)
      .single();
  },

  async updateNotification(mathongbao: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .update(payload)
      .eq("mathongbao", mathongbao)
      .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
      .single();
  },

  async deleteDaDocThongBaoByNotification(mathongbao: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbaodadoc")
      .delete()
      .eq("mathongbao", mathongbao);
  },

  async deleteNotification(mathongbao: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("thongbao")
      .delete()
      .eq("mathongbao", mathongbao);
  }
};
