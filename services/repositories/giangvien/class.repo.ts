import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const classRepo = {
  async getClassesPhanCong(magv: string, mahocky: number | null) {
    const supabase = await getSupabaseClient();
    let query = supabase
      .from("phancong")
      .select(`
        maphancong, malop, malophoc, sisomax, ngaybatdau, ngayketthuc,
        monhoc ( mamon, tenmon, sotinchi ),
        lop ( tenlop, nganh )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true);

    if (mahocky !== null) {
      query = query.eq("mahocky", mahocky);
    }

    return await query.order("ngaybatdau", { ascending: false });
  },

  async getHocKyList() {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("hocky")
      .select("mahocky, tenhocky, namhoc, ky, danghieuluc")
      .order("namhoc", { ascending: false })
      .order("ky", { ascending: false });
  },

  async getSinhVienMonHocCounts(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select("maphancong")
      .in("maphancong", maphancongIds)
      .eq("trangthai", "Danghoc");
  },

  async getLichHocRepresentative(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("maphancong, thutrongtuan, tietbatdau, tietketthuc, phonghoc:maphong")
      .in("maphancong", maphancongIds);
  },

  async getLichTuanFull(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select(`
        malichhoc, thutrongtuan, tietbatdau, tietketthuc, phonghoc:maphong,
        phancong!inner (
          maphancong,
          ngaybatdau,
          ngayketthuc,
          monhoc ( tenmon ),
          lop ( tenlop )
        )
      `)
      .in("maphancong", maphancongIds)
      .order("thutrongtuan")
      .order("tietbatdau");
  },

  async getTaiLieuList(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .select(`
        matailieu, tieude, loai, duongdan, dungluong,
        luotxem, chopheptai, ngaytao, ngaycapnhat,
        maphancong,
        phancong ( monhoc ( tenmon ), lop ( tenlop ) )
      `)
      .in("maphancong", maphancongIds)
      .neq("loai", "File")
      .order("ngaytao", { ascending: false });
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

  async checkTaiLieuBelongsToTeacher(matailieu: number, magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .select(`
        matailieu,
        phancong ( magv )
      `)
      .eq("matailieu", matailieu)
      .single();
  },

  async createTaiLieu(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .insert(payload)
      .select()
      .single();
  },

  async deleteTaiLieu(matailieu: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("tailieu")
      .delete()
      .eq("matailieu", matailieu);
  }
};
