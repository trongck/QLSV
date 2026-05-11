import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/stats.repo";

export async function getSinhVienDetailForStatsService(
  supabase: SupabaseClient,
  masv: string,
  userAccount: { mataikhoan: string },
  ip: string
) {
  const { data, error } = await repo.getSinhVienDetailForStatsRepo(supabase, masv);
  if (error) throw new Error(error.message);

  // Ghi nhật ký hệ thống: xem sinh viên
  await repo.logSystemActionRepo(supabase, {
    mataikhoan: userAccount.mataikhoan,
    hanhdong: `Xem chi tiết sinh viên: ${data.hoten} (${masv})`,
    tentable: "sinhvien",
    makhoachinh: masv,
    diachiip: ip
  });

  return data;
}

export async function getGiangVienDetailForStatsService(
  supabase: SupabaseClient,
  magv: string,
  userAccount: { mataikhoan: string },
  ip: string
) {
  const { data, error } = await repo.getGiangVienDetailForStatsRepo(supabase, magv);
  if (error) throw new Error(error.message);

  // Ghi nhật ký hệ thống: xem giảng viên
  await repo.logSystemActionRepo(supabase, {
    mataikhoan: userAccount.mataikhoan,
    hanhdong: `Xem chi tiết giảng viên: ${data.hoten} (${magv})`,
    tentable: "giangvien",
    makhoachinh: magv,
    diachiip: ip
  });

  return data;
}

export async function globalSearchService(
  supabase: SupabaseClient,
  search: string,
  userAccount: { mataikhoan: string },
  ip: string
) {
  const results = await repo.globalSearchRepo(supabase, search);
  const [
    { data: sinhvien, error: svErr },
    { data: giangvien, error: gvErr },
    { data: lop, error: lopErr },
    { data: monhoc, error: monErr }
  ] = results;

  if (svErr) throw new Error(svErr.message);
  if (gvErr) throw new Error(gvErr.message);
  if (lopErr) throw new Error(lopErr.message);
  if (monErr) throw new Error(monErr.message);

  // Ghi nhật ký hệ thống: Tìm kiếm toàn cầu
  await repo.logSystemActionRepo(supabase, {
    mataikhoan: userAccount.mataikhoan,
    hanhdong: `Tìm kiếm hệ thống: "${search}"`,
    diachiip: ip
  });

  return {
    sinhvien: sinhvien ?? [],
    giangvien: giangvien ?? [],
    lop: lop ?? [],
    monhoc: monhoc ?? []
  };
}

export async function getDashboardStatsService(supabase: SupabaseClient) {
  const jsDay = new Date().getDay();
  const thuTrongTuan = jsDay === 0 ? 8 : jsDay + 1; // 2 -> 8 (Chủ nhật là 8)

  const [
    counts,
    { data: svList, error: svErr },
    { data: gvList, error: gvErr },
    { data: todaySchedules, error: schedErr },
    { data: auditLogs, error: logErr }
  ] = await Promise.all([
    repo.getCountsRepo(supabase),
    repo.getRecentSVRepo(supabase, 8),
    repo.getRecentGVRepo(supabase, 8),
    repo.getTodaySchedulesRepo(supabase, thuTrongTuan),
    repo.getAuditLogsRepo(supabase, 20)
  ]);

  const [
    { count: totalSV, error: tSVErr },
    { count: totalGV, error: tGVErr },
    { count: totalLop, error: tLopErr },
    { count: totalKhoa, error: tKhoaErr }
  ] = counts;

  if (tSVErr) throw new Error(tSVErr.message);
  if (tGVErr) throw new Error(tGVErr.message);
  if (tLopErr) throw new Error(tLopErr.message);
  if (tKhoaErr) throw new Error(tKhoaErr.message);
  if (svErr) throw new Error(svErr.message);
  if (gvErr) throw new Error(gvErr.message);
  if (schedErr) throw new Error(schedErr.message);
  if (logErr) throw new Error(logErr.message);

  return {
    totalSV: totalSV ?? 0,
    totalGV: totalGV ?? 0,
    totalLop: totalLop ?? 0,
    totalKhoa: totalKhoa ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentSV: (svList ?? []).map((sv: any) => ({
      masv: sv.masv,
      hoten: sv.hoten,
      tenlop: sv.lop?.tenlop ?? "—",
      trangthai: sv.trangthai,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentGV: (gvList ?? []).map((gv: any) => ({
      magv: gv.magv,
      hoten: gv.hoten,
      tenkhoa: gv.khoa?.tenkhoa ?? "—",
      hocvi: gv.hocvi ?? null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    todaySchedules: (todaySchedules ?? [])
      .filter((lh: any) =>
        lh.phancong?.danghieuluc === true &&
        lh.phancong?.hocky?.danghieuluc === true
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((lh: any) => ({
        malichhoc: lh.malichhoc,
        tietbatdau: lh.tietbatdau,
        tietketthuc: lh.tietketthuc,
        maphong: lh.maphong,
        loaiphong: lh.phonghoc?.loaiphong ?? null,
        suchua: lh.phonghoc?.suchua ?? null,
        ghichu: lh.ghichu,
        monhoc: lh.phancong?.monhoc?.tenmon ?? "—",
        giangvien: lh.phancong?.giangvien?.hoten ?? "—",
        lop: lh.phancong?.lop?.tenlop ?? "—",
        hocky: lh.phancong?.hocky?.tenhocky ?? "—",
      })),
    auditLogs: auditLogs ?? []
  };
}
