import { notificationRepo } from "@/services/repositories/giangvien/notification.repo";
import { getVietnamTimeISO } from "@/lib/utils/date";

const parseToVNTimeMs = (dateInput: string | Date) => {
  if (dateInput instanceof Date) {
    return dateInput.getTime();
  }
  let str = dateInput.trim().replace(' ', 'T');
  // If the timestamp has no timezone info (no Z, +, or -xx:xx),
  // force it to Indochina Time (+07:00) since DB stores VN local time
  if (!str.includes('Z') && !str.includes('+') && !/-\d{2}:\d{2}$/.test(str)) {
    str = str + '+07:00';
  }
  return new Date(str).getTime();
};

export const notificationService = {
  /**
   * Lấy danh sách thông báo của giảng viên (có phân trang và bộ lọc)
   */
  async getNotifications(
    mataikhoan: string,
    params: { search?: string; loai?: string; page?: number; limit?: number }
  ) {
    const search = params.search ?? "";
    const loai = params.loai ?? "";
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 15));
    const offset = (page - 1) * limit;

    const { data: rawData, error } = await notificationRepo.getNotificationsList(search, loai, mataikhoan);
    if (error) throw error;

    // Filter in-memory for active/expired status (creators can see all their own notifications)
    const now = new Date();
    const filtered = (rawData ?? []).filter((tb: any) => {
      if (tb.mataikhoantao === mataikhoan) return true;
      const ngaytaoTime = parseToVNTimeMs(tb.ngaytao);
      const ngayhethanTime = tb.ngayhethan ? parseToVNTimeMs(tb.ngayhethan) : null;
      if (ngaytaoTime > now.getTime()) return false;
      if (ngayhethanTime !== null && ngayhethanTime < now.getTime()) return false;
      return true;
    });

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Fetch read status for the filtered/paginated notifications
    const ids = paginated.map((tb: any) => tb.mathongbao);
    const readMap: Record<number, { dadoc: boolean; thoigiandoc: string | null }> = {};

    if (ids.length > 0) {
      const { data: readRows } = await notificationRepo.getDaDocThongBao(mataikhoan, ids);

      for (const r of readRows ?? []) {
        readMap[r.mathongbao] = { dadoc: r.dadoc, thoigiandoc: r.thoigiandoc };
      }
    }

    const data = paginated.map((tb: any) => ({
      ...tb,
      dadoc: readMap[tb.mathongbao]?.dadoc ?? false,
      thoigiandoc: readMap[tb.mathongbao]?.thoigiandoc ?? null,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Tạo thông báo mới
   */
  async createNotification(
    mataikhoan: string,
    body: {
      tieude: string;
      noidung: string;
      loai?: string;
      doituong?: string;
      malop?: string;
      maphancong?: number | string;
      ngayhethan?: string;
      ghim?: boolean;
    }
  ) {
    const { tieude, noidung, loai, doituong, malop, maphancong, ngayhethan, ghim } = body;

    if (!tieude || !tieude.trim()) {
      throw new Error("Tiêu đề không được để trống");
    }
    if (!noidung || !noidung.trim()) {
      throw new Error("Nội dung không được để trống");
    }

    const insertPayload: Record<string, any> = {
      mataikhoantao: mataikhoan,
      tieude: tieude.trim(),
      noidung: noidung.trim(),
      loai: loai || "Chung",
      doituong: doituong || "Tatca",
      malop: malop || null,
      maphancong: maphancong ? Number(maphancong) : null,
      ngayhethan: ngayhethan || null,
      ghim: Boolean(ghim),
      ngaytao: getVietnamTimeISO(),
      ngaycapnhat: getVietnamTimeISO(),
    };

    const { data, error } = await notificationRepo.createNotification(insertPayload);
    if (error) throw error;
    return data;
  },

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markNotificationsRead(
    mataikhoan: string,
    body: { all?: boolean; mathongbao?: number; dadoc?: boolean }
  ) {
    const vnNow = getVietnamTimeISO();

    if (body.all === true) {
      // Find all active notifications for teachers
      const { data: all, error: findError } = await notificationRepo.getAllTeacherNotificationIds();

      if (findError) throw findError;
      if (!all || all.length === 0) return true;

      const tbIds = all.map((tb) => tb.mathongbao);
      
      // Delete existing records to avoid conflict
      await notificationRepo.deleteDaDocThongBaoBatch(mataikhoan, tbIds);

      // Insert new read records
      const insertRows = all.map((tb) => ({
        mathongbao: tb.mathongbao,
        mataikhoan,
        dadoc: true,
        thoigiandoc: vnNow,
      }));

      const { error: insertError } = await notificationRepo.insertDaDocThongBaoBatch(insertRows);
      if (insertError) throw insertError;
      return true;
    }

    if (!body.mathongbao || typeof body.mathongbao !== "number") {
      throw new Error("mathongbao không hợp lệ");
    }

    // Delete existing to avoid conflict
    await notificationRepo.deleteDaDocThongBaoSingle(body.mathongbao, mataikhoan);

    // Insert only if dadoc is true
    if (body.dadoc !== false) {
      const { error: insertError } = await notificationRepo.insertDaDocThongBaoSingle({
        mathongbao: body.mathongbao,
        mataikhoan,
        dadoc: true,
        thoigiandoc: vnNow,
      });

      if (insertError) throw insertError;
    }

    return true;
  },

  /**
   * Cập nhật thông báo của giảng viên
   */
  async updateNotification(
    mataikhoan: string,
    mathongbao: number,
    body: {
      tieude?: string;
      noidung?: string;
      loai?: string;
      doituong?: string;
      malop?: string;
      maphancong?: number | string;
      ngayhethan?: string;
      ghim?: boolean;
      ngaytao?: string;
    }
  ) {
    // 1. Verify notification exists and was created by this teacher
    const { data: existing, error: fetchError } = await notificationRepo.getNotificationById(mathongbao);

    if (fetchError || !existing) {
      throw new Error("Không tìm thấy thông báo");
    }

    if (existing.mataikhoantao !== mataikhoan) {
      throw new Error("Bạn không có quyền chỉnh sửa thông báo này");
    }

    // 2. Perform the update
    const updatePayload: Record<string, any> = {};
    if (body.tieude !== undefined) updatePayload.tieude = body.tieude.trim();
    if (body.noidung !== undefined) updatePayload.noidung = body.noidung.trim();
    if (body.loai !== undefined) updatePayload.loai = body.loai;
    if (body.doituong !== undefined) updatePayload.doituong = body.doituong;
    if (body.malop !== undefined) updatePayload.malop = body.malop || null;
    if (body.maphancong !== undefined) {
      updatePayload.maphancong = body.maphancong ? Number(body.maphancong) : null;
    }
    if (body.ngayhethan !== undefined) updatePayload.ngayhethan = body.ngayhethan || null;
    if (body.ghim !== undefined) updatePayload.ghim = Boolean(body.ghim);
    if (body.ngaytao !== undefined) updatePayload.ngaytao = body.ngaytao;

    updatePayload.ngaycapnhat = getVietnamTimeISO();

    const { data: updated, error: updateError } = await notificationRepo.updateNotification(mathongbao, updatePayload);
    if (updateError) throw updateError;
    return updated;
  },

  /**
   * Xóa thông báo của giảng viên
   */
  async deleteNotification(mataikhoan: string, mathongbao: number) {
    // 1. Verify notification exists and was created by this teacher
    const { data: existing, error: fetchError } = await notificationRepo.getNotificationById(mathongbao);

    if (fetchError || !existing) {
      throw new Error("Không tìm thấy thông báo");
    }

    if (existing.mataikhoantao !== mataikhoan) {
      throw new Error("Bạn không có quyền xóa thông báo này");
    }

    // 1.5 Delete related read status records first to avoid foreign key violation
    await notificationRepo.deleteDaDocThongBaoByNotification(mathongbao);

    // 2. Perform delete
    const { error: deleteError } = await notificationRepo.deleteNotification(mathongbao);
    if (deleteError) throw deleteError;

    return true;
  }
};
