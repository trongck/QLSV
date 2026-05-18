import { SupabaseClient } from "@supabase/supabase-js";
import { getVietnamTimeISO } from "@/lib/utils/date";

export async function getThongbaoListRepo(
  supabase: SupabaseClient,
  params: {
    search?: string;
    loai?: string;
    doituong?: string;
    trangthai?: string;
    from: number;
    to: number;
  }
) {
  let query = supabase
    .from("thongbao")
    .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)", { count: "exact" })
    .order("ghim", { ascending: false })
    .order("ngaytao", { ascending: false })
    .range(params.from, params.to);

  if (params.search) query = query.ilike("tieude", `%${params.search}%`);
  if (params.loai) query = query.eq("loai", params.loai);
  if (params.doituong) query = query.eq("doituong", params.doituong);

  const nowStr = getVietnamTimeISO();
  if (params.trangthai === "Active") {
    query = query.lte("ngaytao", nowStr).or(`ngayhethan.is.null,ngayhethan.gte.${nowStr}`);
  } else if (params.trangthai === "Scheduled") {
    query = query.gt("ngaytao", nowStr);
  } else if (params.trangthai === "Expired") {
    query = query.lt("ngayhethan", nowStr);
  }

  return query;
}


export async function createThongbaoRepo(supabase: SupabaseClient, payload: Record<string, any>) {
  return supabase
    .from("thongbao")
    .insert(payload)
    .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
    .single();
}

export async function updateThongbaoRepo(supabase: SupabaseClient, mathongbao: number, payload: Record<string, any>) {
  return supabase
    .from("thongbao")
    .update(payload)
    .eq("mathongbao", mathongbao)
    .select("*, taikhoan:mataikhoantao(email, vaitro), lop:malop(tenlop)")
    .single();
}

export async function deleteThongbaoRepo(supabase: SupabaseClient, mathongbao: number) {
  return supabase
    .from("thongbao")
    .delete()
    .eq("mathongbao", mathongbao);
}
