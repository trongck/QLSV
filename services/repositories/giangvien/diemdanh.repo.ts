import { getSupabaseClient } from "@/lib/utils/supabase/server";

export const diemdanhRepo = {
  async getAttendancePhanCong(magv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select(`
        maphancong, malop, malophoc, ngaybatdau, ngayketthuc,
        monhoc ( mamon, tenmon ),
        lop ( tenlop ),
        hocky:mahocky!inner ( danghieuluc )
      `)
      .eq("magv", magv)
      .eq("danghieuluc", true)
      .eq("hocky.danghieuluc", true);
  },

  async getLichHocList(maphancongIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("malichhoc, maphancong, thutrongtuan")
      .in("maphancong", maphancongIds);
  },

  async getBuoiHocList(malichhocIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .select("mabuoihoc, malichhoc, ngayhoc, trangthai, qr_secret")
      .in("malichhoc", malichhocIds)
      .order("ngayhoc", { ascending: false });
  },

  async getDonXinNghiList(mabuoihocIds: number[]) {
    const supabase = await getSupabaseClient();
    return await supabase 
      .from("donxinnghi")
      .select(`
        madon, masv, mabuoihoc, lydo, minhchung, trangthai, ngaytao, ngaycapnhat,
        sinhvien ( hodem, ten )
      `)
      .in("mabuoihoc", mabuoihocIds)
      .order("ngaytao", { ascending: false });
  },

  async getSinhVienMonHocList(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select(`
        masv,
        sinhvien ( hodem, ten, face_embedding )
      `)
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");
  },

  async getDiemDanhList(mabuoihoc: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .select("masv, trangthai, ghichu, thoigiandiemdanh")
      .eq("mabuoihoc", mabuoihoc);
  },

  async getLichHocSingle(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("malichhoc")
      .eq("maphancong", maphancong)
      .limit(1)
      .single();
  },

  async getPhanCongInfo(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("phancong")
      .select("maphancong, ngaybatdau, ngayketthuc, danghieuluc")
      .eq("maphancong", maphancong)
      .single();
  },

  async getLichHocByPhanCongAndDay(maphancong: number, thutrongtuan: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("lichhoc")
      .select("malichhoc, thutrongtuan")
      .eq("maphancong", maphancong)
      .eq("thutrongtuan", thutrongtuan);
  },

  async getExistingBuoiHoc(malichhoc: number, ngayhoc: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .select("mabuoihoc")
      .eq("malichhoc", malichhoc)
      .eq("ngayhoc", ngayhoc)
      .maybeSingle();
  },

  async createBuoiHoc(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .insert(payload)
      .select("mabuoihoc, malichhoc, ngayhoc, trangthai")
      .single();
  },

  async getSinhVienMonHocListBasic(maphancong: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("sinhvienmonhoc")
      .select("masv")
      .eq("maphancong", maphancong)
      .eq("trangthai", "Danghoc");
  },

  async getApprovedLeaves(mabuoihoc: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("donxinnghi")
      .select("masv")
      .eq("mabuoihoc", mabuoihoc)
      .eq("trangthai", "DaDuyet");
  },

  async insertDiemDanhBatch(inserts: any[]) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .insert(inserts);
  },

  async getExistingDiemDanh(mabuoihoc: number, masv: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .select("madiemdanh")
      .eq("mabuoihoc", mabuoihoc)
      .eq("masv", masv)
      .maybeSingle();
  },

  async updateDiemDanh(madiemdanh: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .update(payload)
      .eq("madiemdanh", madiemdanh);
  },

  async insertDiemDanh(payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("diemdanh")
      .insert(payload);
  },

  async updateDonXinNghi(madon: number, payload: any) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("donxinnghi")
      .update(payload)
      .eq("madon", madon)
      .select("mabuoihoc, masv")
      .single();
  },

  async updateBuoiHocQRCode(mabuoihoc: number, qrSecret: string) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .update({
        qr_secret: qrSecret,
        trangthai: "DangDiemdanh"
      })
      .eq("mabuoihoc", mabuoihoc)
      .select("qr_secret")
      .single();
  },

  async getBuoiHocForCheckin(mabuoihoc: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .select(`
        mabuoihoc,
        qr_secret,
        trangthai,
        lichhoc ( maphong )
      `)
      .eq("mabuoihoc", mabuoihoc)
      .single();
  },

  async endBuoiHoc(mabuoihoc: number) {
    const supabase = await getSupabaseClient();
    return await supabase
      .from("buoihoc")
      .update({
        trangthai: "Hoanthanh",
        qr_secret: null
      })
      .eq("mabuoihoc", mabuoihoc)
      .select("mabuoihoc, trangthai")
      .single();
  }
};
