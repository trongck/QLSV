import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/phonghoc.repo";

export async function getPhongHocListService(supabase: SupabaseClient) {
  const { data, error } = await repo.getPhongHocListRepo(supabase);
  if (error) throw new Error(error.message);
  return data;
}

export async function getPhongHocByCodeService(supabase: SupabaseClient, maphong: string) {
  const { data, error } = await repo.getPhongHocByCodeRepo(supabase, maphong);
  if (error) throw new Error(error.message);
  return data;
}

export async function createPhongHocService(
  supabase: SupabaseClient,
  payload: { maphong: string; loaiphong: string; suchua: number }
) {
  const maphongClean = payload.maphong.trim().toUpperCase();
  if (!maphongClean) throw new Error("Mã phòng học không được để trống.");
  if (payload.suchua <= 0) throw new Error("Sức chứa phòng học phải lớn hơn 0.");

  // Check if room code already exists using repository
  const existing = await getPhongHocByCodeService(supabase, maphongClean);

  if (existing) {
    throw new Error(`Mã phòng học "${maphongClean}" đã tồn tại trên hệ thống.`);
  }

  const { data, error } = await repo.createPhongHocRepo(supabase, {
    maphong: maphongClean,
    loaiphong: payload.loaiphong,
    suchua: payload.suchua
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePhongHocService(
  supabase: SupabaseClient,
  maphong: string,
  payload: { loaiphong: string; suchua: number }
) {
  if (payload.suchua <= 0) throw new Error("Sức chứa phòng học phải lớn hơn 0.");

  const { data, error } = await repo.updatePhongHocRepo(supabase, maphong, payload);
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePhongHocService(supabase: SupabaseClient, maphong: string) {
  // Check if room is bound to any scheduled classes
  const { count, error: countErr } = await repo.checkPhongHocHasSchedulesRepo(supabase, maphong);
  if (countErr) throw new Error(countErr.message);

  if (count && count > 0) {
    throw new Error(
      `Không thể xóa phòng học "${maphong}" vì phòng học này đang có ${count} lịch giảng dạy hoạt động.`
    );
  }

  const { error } = await repo.deletePhongHocRepo(supabase, maphong);
  if (error) throw new Error(error.message);
  return true;
}

export async function getPhongHocSchedulesService(supabase: SupabaseClient, maphong: string) {
  const { data, error } = await repo.getPhongHocSchedulesRepo(supabase, maphong);
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((lh: any) => ({
    malichhoc: lh.malichhoc,
    thutrongtuan: lh.thutrongtuan,
    tietbatdau: lh.tietbatdau,
    tietketthuc: lh.tietketthuc,
    ghichu: lh.ghichu,
    monhoc: lh.phancong?.monhoc?.tenmon ?? "—",
    giangvien: lh.phancong?.giangvien?.hoten ?? "—",
    lop: lh.phancong?.lop?.tenlop ?? "—",
    hocky: lh.phancong?.hocky?.tenhocky ?? "—",
  }));
}

export async function checkPhongHocConflictService(
  supabase: SupabaseClient,
  maphong: string,
  thutrongtuan: number,
  tietbatdau: number,
  tietketthuc: number,
  excludeLichHocId?: number
) {
  const { data, error } = await repo.checkPhongHocConflictRepo(
    supabase,
    maphong,
    thutrongtuan,
    tietbatdau,
    tietketthuc,
    excludeLichHocId
  );

  if (error) throw new Error(error.message);
  return {
    isConflict: (data ?? []).length > 0,
    conflicts: data ?? []
  };
}

/** Advanced Service: Computes Room Utilization score based on active schedules */
export async function getRoomUtilizationStatsService(supabase: SupabaseClient) {
  const { data: schedules, error } = await repo.getRoomUtilizationStatsRepo(supabase);
  if (error) throw new Error(error.message);

  const { data: rooms, error: roomErr } = await repo.getPhongHocListRepo(supabase);
  if (roomErr) throw new Error(roomErr.message);

  // Utilization calculation (Total periods booked out of theoretical maximum of 60 periods per week - 10 periods/day * 6 days)
  const maxWeeklyPeriods = 60;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usageMap: Record<string, number> = {};
  (rooms ?? []).forEach((r) => {
    usageMap[r.maphong] = 0;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (schedules ?? []).forEach((sch: any) => {
    if (sch.maphong && usageMap[sch.maphong] !== undefined) {
      const periodsCount = Math.max(1, sch.tietketthuc - sch.tietbatdau + 1);
      usageMap[sch.maphong] += periodsCount;
    }
  });

  return (rooms ?? []).map((r) => {
    const bookedPeriods = usageMap[r.maphong] || 0;
    const rate = Math.min(100, Math.round((bookedPeriods / maxWeeklyPeriods) * 100));
    return {
      maphong: r.maphong,
      loaiphong: r.loaiphong,
      suchua: r.suchua,
      bookedPeriods,
      utilizationRate: rate,
      status: rate > 60 ? "Overutilized" : rate > 15 ? "Healthy" : rate > 0 ? "Underutilized" : "Idle"
    };
  });
}
