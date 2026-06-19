import { reportRepo } from "@/services/repositories/giangvien/report.repo";

export const reportService = {
  /**
   * Tính toán thống kê học phần
   */
  async getClassStats(magv: string, maphancong: number) {
    // Validate quyền
    const { data: pcCheck } = await reportRepo.checkPhanCongBelongsToTeacher(magv, maphancong);

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    // 1. Sĩ số lớp
    const { data: svList } = await reportRepo.getSinhVienMonHocList(maphancong);
    const totalStudents = svList?.length || 0;

    // 2. Điểm tổng kết & Phân bổ điểm
    const { data: tkRows } = await reportRepo.getDiemTongKetRows(maphancong);

    let totalGpa = 0;
    let passCount = 0;
    const gradeDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    if (tkRows && tkRows.length > 0) {
      (tkRows as { diemtongket: number | null; diemchu: string | null }[]).forEach(r => {
        const val = r.diemtongket || 0;
        totalGpa += val;
        if (val >= 4.0) passCount++;

        const chu = (r.diemchu || "").toUpperCase();
        if (chu.startsWith("A")) gradeDist.A++;
        else if (chu.startsWith("B")) gradeDist.B++;
        else if (chu.startsWith("C")) gradeDist.C++;
        else if (chu.startsWith("D")) gradeDist.D++;
        else gradeDist.F++;
      });
    }

    const avgGpa = totalStudents > 0 ? Number((totalGpa / totalStudents).toFixed(2)) : 0;
    const passRate = totalStudents > 0 ? Number(((passCount / totalStudents) * 100).toFixed(1)) : 0;

    // 3. Tỉ lệ điểm danh
    const { data: lichList } = await reportRepo.getLichHocList(maphancong);
    const lichIds = (lichList as { malichhoc: number }[] ?? []).map(l => l.malichhoc);

    let avgAttendance = 0;

    if (lichIds.length > 0) {
      const { data: buoiList } = await reportRepo.getBuoiHocList(lichIds);
      const buoiIds = (buoiList as { mabuoihoc: number }[] ?? []).map(b => b.mabuoihoc);

      if (buoiIds.length > 0) {
        const { data: ddRows } = await reportRepo.getDiemDanhRows(buoiIds);

        if (ddRows && ddRows.length > 0) {
          const present = (ddRows as { trangthai: string }[]).filter(d => d.trangthai === "Comat" || d.trangthai === "Dimuon").length;
          avgAttendance = Number(((present / ddRows.length) * 100).toFixed(1));
        }
      }
    }

    return {
      avgAttendance,
      passRate,
      avgGpa,
      gradeDist: {
        A: totalStudents > 0 ? Math.round((gradeDist.A / totalStudents) * 100) : 0,
        B: totalStudents > 0 ? Math.round((gradeDist.B / totalStudents) * 100) : 0,
        C: totalStudents > 0 ? Math.round((gradeDist.C / totalStudents) * 100) : 0,
        DF: totalStudents > 0 ? Math.round((gradeDist.D + gradeDist.F) / totalStudents * 100) : 0
      }
    };
  },

  /**
   * Lấy danh sách báo cáo cũ
   */
  async getReports(magv: string, maphancong: number) {
    const { data: pcCheck } = await reportRepo.checkPhanCongBelongsToTeacher(magv, maphancong);

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    const list = await reportRepo.getReportsList(maphancong);

    return list.data ?? [];
  },

  /**
   * Tạo báo cáo mới
   */
  async createReport(
    magv: string,
    maphancong: number,
    tieude: string,
    mota: string,
    statsJson: string
  ) {
    const { data: pcCheck } = await reportRepo.checkPhanCongBelongsToTeacher(magv, maphancong);

    if (!pcCheck) {
      throw new Error("Không có quyền truy cập lớp học phần này");
    }

    const { data, error } = await reportRepo.createReport({
      maphancong,
      tieude,
      mota,
      loai: "File",
      duongdan: statsJson,
      chopheptai: false,
      dungluong: 0,
      luotxem: 0
    });

    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật báo cáo (tiêu đề và/hoặc nhận xét)
   */
  async updateReport(
    magv: string,
    matailieu: number,
    updates: { tieude?: string; mota?: string }
  ) {
    const { data: pcCheck } = await reportRepo.getPhanCongList(magv);
    const maphancongIds = (pcCheck as { maphancong: number }[] ?? []).map(p => p.maphancong);

    const { data: tlCheck } = await reportRepo.getTaiLieuCheck(matailieu, maphancongIds);

    if (!tlCheck) {
      throw new Error("Không tìm thấy báo cáo hoặc bạn không có quyền chỉnh sửa");
    }

    const updatePayload: Record<string, unknown> = {
      ngaycapnhat: new Date().toISOString()
    };
    if (updates.tieude !== undefined) updatePayload.tieude = updates.tieude;
    if (updates.mota !== undefined) updatePayload.mota = updates.mota;

    const { error } = await reportRepo.updateReport(matailieu, updatePayload);

    if (error) throw error;
    return true;
  },
};
