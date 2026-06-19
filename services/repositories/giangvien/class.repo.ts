import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const classRepo = {
  async getClassesPhanCong(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select(`
        maphancong, malop, malophoc, sisomax, ngaybatdau, ngayketthuc,
        monhoc ( mamon, tenmon, sotinchi ),
        lop ( tenlop, nganh )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true)
      .order("ngaybatdau", { ascending: false });
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
        phancong ( monhoc ( tenmon ), lop ( tenlop ) )
      `)
      .in("maphancong", maphancongIds)
      .order("ngaytao", { ascending: false });
  }
};
