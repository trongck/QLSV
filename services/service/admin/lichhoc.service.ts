import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "../../repositories/admin/lichhoc.repo";

function mapLichHocRow(row: any) {
  if (!row) return row;
  if (row.phancong?.giangvien) {
    row.phancong.giangvien.hoten = [
      row.phancong.giangvien.hodem,
      row.phancong.giangvien.ten
    ].filter(Boolean).join(" ") || "Chưa thiết lập";
  }
  return row;
}

export async function getLichHocListService(
  supabase: SupabaseClient,
  params: {
    maphancong?: string;
    thutrongtuan?: string;
    magv?: string;
    malop?: string;
    mahocky?: string;
    maphong?: string;
    page: number;
    limit: number;
    hasPage: boolean;
    status?: "ongoing" | "ended" | "all";
  }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getLichHocListRepo(supabase, {
    maphancong: params.maphancong,
    thutrongtuan: params.thutrongtuan,
    magv: params.magv,
    malop: params.malop,
    mahocky: params.mahocky,
    maphong: params.maphong,
    from,
    to,
    limit: params.limit,
    hasPage: params.hasPage,
    status: params.status,
  });

  if (error) throw new Error(error.message);

  return {
    data: (data ?? []).map(mapLichHocRow),
    total: count ?? 0,
  };
}

export async function createLichHocService(supabase: SupabaseClient, body: any) {
  const { maphancong, thutrongtuan, tietbatdau, tietketthuc, maphong, ghichu } = body;

  const thu = parseInt(thutrongtuan);
  const tbd = parseInt(tietbatdau);
  const tkt = parseInt(tietketthuc);

  // Get info about assignment
  const { data: pc, error: pcError } = await repo.getPhanCongDetailRepo(supabase, parseInt(maphancong));
  if (pcError || !pc) {
    throw new Error("Không tìm thấy phân công giảng dạy tương ứng.");
  }

  // 1. Conflict check for Teacher
  const { data: teacherConflicts, error: tcError } = await repo.getTeacherConflictsRepo(supabase, pc.magv, pc.mahocky, thu);
  if (tcError) throw new Error(tcError.message);

  for (const item of (teacherConflicts || [])) {
    if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
      throw new Error(`Trùng lịch giảng viên: Giảng viên đã có lịch dạy môn "${item.phancong.monhoc.tenmon}" cho lớp "${item.phancong.lop.tenlop}" tại phòng "${item.maphong || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
    }
  }

  // 2. Conflict check for Class
  const { data: classConflicts, error: ccError } = await repo.getClassConflictsRepo(supabase, pc.malop, pc.mahocky, thu);
  if (ccError) throw new Error(ccError.message);

  for (const item of (classConflicts || [])) {
    if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
      const teacherName = item.phancong?.giangvien
        ? [item.phancong.giangvien.hodem, item.phancong.giangvien.ten].filter(Boolean).join(" ")
        : "—";
      throw new Error(`Trùng lịch lớp học: Lớp đã có lịch học môn "${item.phancong.monhoc.tenmon}" với Giảng viên "${teacherName}" tại phòng "${item.maphong || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
    }
  }

  // 3. Conflict check for Room (if not Online)
  if (maphong?.trim()) {
    const { data: phong } = await repo.getRoomTypeRepo(supabase, maphong.trim());
    if (!phong) {
      throw new Error(`Phòng học "${maphong.trim()}" không tồn tại trong hệ thống.`);
    }

    if (phong.loaiphong !== "Online") {
      const { data: roomConflicts, error: rcError } = await repo.getRoomConflictsRepo(supabase, maphong.trim(), pc.mahocky, thu);
      if (rcError) throw new Error(rcError.message);

      //--------------item.tietbatdau------------item.tietketthuc-----------
      for (const item of (roomConflicts || [])) {
        if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
          throw new Error(`Trùng lịch phòng học: Phòng "${maphong.trim()}" đã được đăng ký sử dụng bởi lớp "${item.phancong.lop.tenlop}" học môn "${item.phancong.monhoc.tenmon}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
        }
      }
    }
  }

  // Sequence generation for unique ID
  const { data: maxLh } = await repo.getMaxLichHocIdRepo(supabase);
  const nextId = maxLh && maxLh.length > 0 ? maxLh[0].malichhoc + 1 : 1;

  const insertPayload = {
    malichhoc: nextId,
    maphancong: parseInt(maphancong),
    thutrongtuan: thu,
    tietbatdau: tbd,
    tietketthuc: tkt,
    maphong: maphong?.trim() || null,
    ghichu: ghichu?.trim() || null,
  };

  const { data, error } = await repo.createLichHocRepo(supabase, insertPayload);
  if (error) throw new Error(error.message);

  return mapLichHocRow(data);
}

export async function updateLichHocService(supabase: SupabaseClient, id: number, body: any) {
  const { maphancong, thutrongtuan, tietbatdau, tietketthuc, maphong, ghichu } = body;

  const thu = parseInt(thutrongtuan);
  const tbd = parseInt(tietbatdau);
  const tkt = parseInt(tietketthuc);

  // Get info about assignment
  const { data: pc, error: pcError } = await repo.getPhanCongDetailRepo(supabase, parseInt(maphancong));
  if (pcError || !pc) {
    throw new Error("Không tìm thấy phân công giảng dạy tương ứng.");
  }

  // 1. Conflict check for Teacher
  const { data: teacherConflicts, error: tcError } = await repo.getTeacherConflictsRepo(supabase, pc.magv, pc.mahocky, thu, id);
  if (tcError) throw new Error(tcError.message);

  for (const item of (teacherConflicts || [])) {
    if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
      throw new Error(`Trùng lịch giảng viên: Giảng viên đã có lịch dạy môn "${item.phancong.monhoc.tenmon}" cho lớp "${item.phancong.lop.tenlop}" tại phòng "${item.maphong || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
    }
  }

  // 2. Conflict check for Class
  const { data: classConflicts, error: ccError } = await repo.getClassConflictsRepo(supabase, pc.malop, pc.mahocky, thu, id);
  if (ccError) throw new Error(ccError.message);

  for (const item of (classConflicts || [])) {
    if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
      const teacherName = item.phancong?.giangvien
        ? [item.phancong.giangvien.hodem, item.phancong.giangvien.ten].filter(Boolean).join(" ")
        : "—";
      throw new Error(`Trùng lịch lớp học: Lớp đã có lịch học môn "${item.phancong.monhoc.tenmon}" với Giảng viên "${teacherName}" tại phòng "${item.maphong || 'N/A'}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
    }
  }

  // 3. Conflict check for Room (if not Online)
  if (maphong?.trim()) {
    const { data: phong } = await repo.getRoomTypeRepo(supabase, maphong.trim());
    if (!phong) {
      throw new Error(`Phòng học "${maphong.trim()}" không tồn tại trong hệ thống.`);
    }

    if (phong.loaiphong !== "Online") {
      const { data: roomConflicts, error: rcError } = await repo.getRoomConflictsRepo(supabase, maphong.trim(), pc.mahocky, thu, id);
      if (rcError) throw new Error(rcError.message);

      for (const item of (roomConflicts || [])) {
        if (tbd <= item.tietketthuc && item.tietbatdau <= tkt) {
          throw new Error(`Trùng lịch phòng học: Phòng "${maphong.trim()}" đã được đăng ký sử dụng bởi lớp "${item.phancong.lop.tenlop}" học môn "${item.phancong.monhoc.tenmon}" vào Thứ ${thu}, Tiết ${item.tietbatdau}-${item.tietketthuc}.`);
        }
      }
    }
  }

  const updatePayload = {
    maphancong: parseInt(maphancong),
    thutrongtuan: thu,
    tietbatdau: tbd,
    tietketthuc: tkt,
    maphong: maphong?.trim() || null,
    ghichu: ghichu?.trim() || null,
  };

  const { data, error } = await repo.updateLichHocRepo(supabase, id, updatePayload);
  if (error) throw new Error(error.message);

  return mapLichHocRow(data);
}

export async function deleteLichHocService(supabase: SupabaseClient, id: number) {
  // Check if there are any dependent actual sessions (buoihoc)
  const { data: sessions, error: sessionsError } = await repo.checkDependentSessionsRepo(supabase, id);
  if (sessionsError) throw new Error(sessionsError.message);

  if (sessions && sessions.length > 0) {
    throw new Error("Không thể xoá lịch học này vì đã có dữ liệu buổi học thực tế đi kèm.");
  }

  const { error } = await repo.deleteLichHocRepo(supabase, id);
  if (error) throw new Error(error.message);
}
