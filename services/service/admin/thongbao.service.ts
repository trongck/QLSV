import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/thongbao.repo";
import { getVietnamTimeISO } from "@/lib/utils/date";

export async function getThongbaoListService(
  supabase: SupabaseClient,
  params: {
    search?: string;
    loai?: string;
    doituong?: string;
    trangthai?: string;
    page: number;
    limit: number;
  }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getThongbaoListRepo(supabase, {
    search: params.search,
    loai: params.loai,
    doituong: params.doituong,
    trangthai: params.trangthai,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  return {
    data,
    total: count ?? 0,
  };
}

export async function createThongbaoService(supabase: SupabaseClient, adminMataikhoan: string, body: any) {
  const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim, ngaytao } = body;

  const insertPayload: Record<string, any> = {
    tieude: tieude.trim(),
    noidung: noidung.trim(),
    loai,
    doituong,
    malop: malop || null,
    maphancong: maphancong ? Number(maphancong) : null,
    ngayhethan: ngayhethan || null,
    ghim: Boolean(ghim),
    mataikhoantao: adminMataikhoan, // [FIX-10] Unified creator via mataikhoan
    ngaytao: ngaytao || getVietnamTimeISO(),
  };

  const { data, error } = await repo.createThongbaoRepo(supabase, insertPayload);
  if (error) throw new Error(error.message);

  return data;
}

export async function updateThongbaoService(supabase: SupabaseClient, id: number, body: any) {
  const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim, ngaytao } = body;

  const updatePayload: Record<string, any> = {};
  if (tieude !== undefined) updatePayload.tieude = tieude.trim();
  if (noidung !== undefined) updatePayload.noidung = noidung.trim();
  if (loai !== undefined) updatePayload.loai = loai;
  if (doituong !== undefined) updatePayload.doituong = doituong;
  if (malop !== undefined) updatePayload.malop = malop || null;
  if (maphancong !== undefined) updatePayload.maphancong = maphancong ? Number(maphancong) : null;
  if (ngayhethan !== undefined) updatePayload.ngayhethan = ngayhethan || null;
  if (ghim !== undefined) updatePayload.ghim = Boolean(ghim);
  if (ngaytao !== undefined) updatePayload.ngaytao = ngaytao;

  const { data, error } = await repo.updateThongbaoRepo(supabase, id, updatePayload);
  if (error) throw new Error(error.message);

  return data;
}

export async function deleteThongbaoService(supabase: SupabaseClient, id: number) {
  const { error } = await repo.deleteThongbaoRepo(supabase, id);
  if (error) throw new Error(error.message);
}
