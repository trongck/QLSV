import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const gradeRepo = {
  async getExistingGrade(maphancong: number, masv: string, loaidiem: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diem")
      .select("madiem")
      .eq("maphancong", maphancong)
      .eq("masv", masv)
      .eq("loaidiem", loaidiem)
      .maybeSingle();
  },

  async updateGrade(madiem: number, data: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diem")
      .update(data)
      .eq("madiem", madiem);
  },

  async insertGrade(data: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diem")
      .insert(data);
  },

  async getGradeClasses(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select(`
        maphancong,
        malophoc,
        malop,
        danghieuluc,
        monhoc:mamon ( tenmon, sotinchi ),
        hocky:mahocky ( mahocky, tenhocky, namhoc, ky, danghieuluc ),
        lop:malop ( tenlop )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true)
      .order("maphancong", { ascending: false });
  },

  async getSinhVienMonHocList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien:masv ( hodem, ten, malop )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc")
      .order("masv", { ascending: true });
  },

  async getDiemRows(maphancong: number, masvList: string[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diem")
      .select("masv, loaidiem, giatri, heso, madiem, ghichu")
      .eq("maphancong", maphancong)
      .in("masv", masvList);
  },

  async getDiemTongKetRows(maphancong: number, masvList: string[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemtongket")
      .select("masv, diemtongket, diemchu, ketqua")
      .eq("maphancong", maphancong)
      .in("masv", masvList);
  },

  async getBaiTapList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("baitap")
      .select("mabaitap, tieude")
      .eq("maphancong", maphancong);
  },

  async getNopBaiRows(mabaitapIds: number[], masvList: string[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("nopbai")
      .select("masv, mabaitap, filenop")
      .in("mabaitap", mabaitapIds)
      .in("masv", masvList)
      .not("filenop", "is", null);
  },

  async getDiemRowsForFinal(maphancong: number, masv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diem")
      .select("loaidiem, giatri, heso")
      .eq("maphancong", maphancong)
      .eq("masv", masv);
  },

  async getExistingFinalGrade(maphancong: number, masv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemtongket")
      .select("masv")
      .eq("maphancong", maphancong)
      .eq("masv", masv)
      .maybeSingle();
  },

  async updateFinalGrade(maphancong: number, masv: string, data: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemtongket")
      .update(data)
      .eq("maphancong", maphancong)
      .eq("masv", masv);
  },

  async insertFinalGrade(data: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemtongket")
      .insert(data);
  }
};
