import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/phancong.repo";
import * as hockyRepo from "../../repositories/admin/hocky.repo";

export async function getPhanCongListService(
  supabase: SupabaseClient,
  params: {
    search?: string;
    magv?: string;
    mamon?: string;
    malop?: string;
    mahocky?: string;
    status?: "ongoing" | "ended" | "all";
    page?: number;
    limit?: number;
  }
) {
  const page = params.page ? Math.max(1, params.page) : undefined;
  const limit = params.limit ?? 50;

  let from: number | undefined;
  let to: number | undefined;

  if (page !== undefined) {
    from = (page - 1) * limit;
    to = from + limit - 1;
  }

  const { data, count, error } = await repo.getPhanCongListRepo(supabase, {
    search: params.search,
    magv: params.magv,
    mamon: params.mamon,
    malop: params.malop,
    mahocky: params.mahocky,
    status: params.status,
    from,
    to,
    limit,
  });

  if (error) throw new Error(error.message);

  const mappedData = data?.map((item: any) => ({
    ...item,
    giangvien: item.giangvien ? {
      ...item.giangvien,
      hoten: [item.giangvien.hodem, item.giangvien.ten].filter(Boolean).join(" ") || "N/A"
    } : null
  }));

  return {
    data: mappedData,
    total: count ?? 0,
  };
}

export async function createPhanCongService(supabase: SupabaseClient, body: any) {
  const { magv, mamon, malop, mahocky, malophoc, sisomax, danghieuluc, ngaybatdau, ngayketthuc } = body;

  // 1. Fetch semester dates for validation
  const { data: hocky, error: hockyError } = await hockyRepo.getHockyByIdRepo(supabase, parseInt(mahocky));
  if (hockyError) throw new Error("Không tìm thấy thông tin học kỳ.");

  if (ngaybatdau && hocky.ngaybatdau && new Date(ngaybatdau) < new Date(hocky.ngaybatdau)) {
    throw new Error(`Ngày bắt đầu (${ngaybatdau}) không được nhỏ hơn ngày bắt đầu học kỳ (${hocky.ngaybatdau})`);
  }
  if (ngayketthuc && hocky.ngayketthuc && new Date(ngayketthuc) > new Date(hocky.ngayketthuc)) {
    throw new Error(`Ngày kết thúc (${ngayketthuc}) không được lớn hơn ngày kết thúc học kỳ (${hocky.ngayketthuc})`);
  }

  // 2. Check duplicate
  const { data: duplicateData, error: duplicateError } = await repo.checkDuplicatePhanCongRepo(supabase, {
    magv,
    mamon,
    malop,
    mahocky: parseInt(mahocky),
    malophoc,
  });

  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicateData && duplicateData.length > 0) {
    throw new Error("Phân công này đã tồn tại trong hệ thống.");
  }

  // 3. Max ID sequences
  const { data: maxPc } = await repo.getMaxPhanCongIdRepo(supabase);
  const nextId = maxPc && maxPc.length > 0 ? maxPc[0].maphancong + 1 : 1;

  // 4. Create phancong
  const { data, error } = await repo.createPhanCongRepo(supabase, {
    maphancong: nextId,
    magv: magv.trim(),
    mamon: mamon.trim(),
    malop: malop.trim(),
    mahocky: parseInt(mahocky),
    malophoc: malophoc?.trim() || null,
    sisomax: sisomax ? parseInt(sisomax) : null,
    danghieuluc: danghieuluc ?? true,
    ngaybatdau: ngaybatdau || null,
    ngayketthuc: ngayketthuc || null,
  });

  if (error) throw new Error(error.message);

  // 5. Automatically enroll students from the administrative class into this assignment
  if (data) {
    await repo.enrollStudentsFromClassRepo(supabase, data.maphancong, malop.trim());
    if (data.giangvien) {
      data.giangvien.hoten = [data.giangvien.hodem, data.giangvien.ten].filter(Boolean).join(" ") || "N/A";
    }
  }

  return data;
}

export async function updatePhanCongService(supabase: SupabaseClient, maphancong: number, body: any) {
  const { magv, mamon, malop, mahocky, malophoc, sisomax, danghieuluc, ngaybatdau, ngayketthuc } = body;

  // 1. Fetch semester dates for validation
  const { data: hocky, error: hockyError } = await hockyRepo.getHockyByIdRepo(supabase, parseInt(mahocky));
  if (hockyError) throw new Error("Không tìm thấy thông tin học kỳ.");

  if (ngaybatdau && hocky.ngaybatdau && new Date(ngaybatdau) < new Date(hocky.ngaybatdau)) {
    throw new Error(`Ngày bắt đầu (${ngaybatdau}) không được nhỏ hơn ngày bắt đầu học kỳ (${hocky.ngaybatdau})`);
  }
  if (ngayketthuc && hocky.ngayketthuc && new Date(ngayketthuc) > new Date(hocky.ngayketthuc)) {
    throw new Error(`Ngày kết thúc (${ngayketthuc}) không được lớn hơn ngày kết thúc học kỳ (${hocky.ngayketthuc})`);
  }

  // 2. Check duplicate
  const { data: duplicateData, error: duplicateError } = await repo.checkDuplicatePhanCongRepo(supabase, {
    magv,
    mamon,
    malop,
    mahocky: parseInt(mahocky),
    malophoc,
    excludeId: maphancong,
  });

  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicateData && duplicateData.length > 0) {
    throw new Error("Phân công trùng lặp với một phân công khác đang tồn tại.");
  }

  // 3. Update phancong
  const { data, error } = await repo.updatePhanCongRepo(supabase, maphancong, {
    magv: magv.trim(),
    mamon: mamon.trim(),
    malop: malop.trim(),
    mahocky: parseInt(mahocky),
    malophoc: malophoc?.trim() || null,
    sisomax: sisomax ? parseInt(sisomax) : null,
    danghieuluc: danghieuluc ?? true,
    ngaybatdau: ngaybatdau || null,
    ngayketthuc: ngayketthuc || null,
  });

  if (error) throw new Error(error.message);

  // 4. Update student enrollment (in case class was changed or new students added)
  if (data) {
    await repo.enrollStudentsFromClassRepo(supabase, maphancong, malop.trim());
    if (data.giangvien) {
      data.giangvien.hoten = [data.giangvien.hodem, data.giangvien.ten].filter(Boolean).join(" ") || "N/A";
    }
  }

  return data;
}

export async function deletePhanCongService(supabase: SupabaseClient, maphancong: number) {
  // 1. Check schedule links
  const { data: scheduleCheck, error: scheduleCheckError } = await repo.checkLichHocForPhanCongRepo(supabase, maphancong);
  if (scheduleCheckError) throw new Error(scheduleCheckError.message);
  if (scheduleCheck && scheduleCheck.length > 0) {
    throw new Error("Không thể xoá phân công này vì đang có lịch học đi kèm. Hãy xoá lịch học trước.");
  }

  // 2. Delete phancong
  const { error } = await repo.deletePhanCongRepo(supabase, maphancong);
  if (error) throw new Error(error.message);
}
