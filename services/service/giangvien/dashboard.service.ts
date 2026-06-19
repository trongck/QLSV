import { dashboardRepo } from "@/services/repositories/giangvien/dashboard.repo";

interface DashboardPhanCong {
  maphancong: number;
  monhoc: { tenmon: string } | null;
  lop: { tenlop: string } | null;
}

interface DashboardThongBao {
  tieude: string;
  ngaytao: string;
}

interface ClassSummary {
  maphancong: number;
  tenmon: string;
  tenlop: string;
  siso: number;
  diemtb: number | null;
  tilechuyencan: number | null;
}

export const dashboardService = {
  /**
   * Lấy thống kê tổng quan dashboard cho giảng viên
   */
  async getDashboardStats(magv: string) {
    // 1. Lấy danh sách phân công đang hiệu lực
    const { data: phancongList } = await dashboardRepo.getActivePhanCong(magv);

    const maphancongIds = (phancongList as unknown as DashboardPhanCong[] ?? []).map(p => p.maphancong);
    const totalClasses = maphancongIds.length;

    let classSummaries: ClassSummary[] = [];
    let totalStudents = 0;

    if (totalClasses > 0) {
      // 2. Sĩ số thực tế từng lớp (Danghoc)
      const { data: svCounts } = await dashboardRepo.getSinhVienMonHocCounts(maphancongIds);

      const sisoMap: Record<number, number> = {};
      (svCounts as { maphancong: number }[] ?? []).forEach(row => {
        sisoMap[row.maphancong] = (sisoMap[row.maphancong] ?? 0) + 1;
      });

      // Tính tổng sĩ số
      totalStudents = (svCounts ?? []).length;

      // 3. Lấy diemtb từ vthongke_phancong
      const { data: tkList } = await dashboardRepo.getVThongKePhanCong(maphancongIds);

      const diemtbMap: Record<number, number | null> = {};
      (tkList as { maphancong: number; diemtb: number | null }[] ?? []).forEach(row => {
        diemtbMap[row.maphancong] = row.diemtb;
      });

      // 4. Tính tỉ lệ chuyên cần cho từng lớp
      const { data: lichhocList } = await dashboardRepo.getLichHocList(maphancongIds);

      const malichhocIds = (lichhocList as { malichhoc: number; maphancong: number }[] ?? []).map(l => l.malichhoc);
      const buoiToLichMap: Record<number, number> = {};
      const tileChuyenCanMap: Record<number, number | null> = {};

      if (malichhocIds.length > 0) {
        const { data: buoihocList } = await dashboardRepo.getBuoiHocList(malichhocIds);

        const mabuoihocIds = (buoihocList as { mabuoihoc: number; malichhoc: number }[] ?? []).map(b => {
          buoiToLichMap[b.mabuoihoc] = b.malichhoc;
          return b.mabuoihoc;
        });

        if (mabuoihocIds.length > 0) {
          const { data: diemdanhList } = await dashboardRepo.getDiemDanhList(mabuoihocIds);

          const statsByPc: Record<number, { total: number; present: number }> = {};
          maphancongIds.forEach((id: number) => {
            statsByPc[id] = { total: 0, present: 0 };
          });

          (diemdanhList as { mabuoihoc: number; trangthai: string }[] ?? []).forEach(dd => {
            const malichhoc = buoiToLichMap[dd.mabuoihoc];
            const maphancong = (lichhocList as { malichhoc: number; maphancong: number }[] ?? []).find(l => l.malichhoc === malichhoc)?.maphancong;
            if (maphancong) {
              statsByPc[maphancong].total += 1;
              if (["Comat", "Dimuon"].includes(dd.trangthai)) {
                statsByPc[maphancong].present += 1;
              }
            }
          });

          maphancongIds.forEach((id: number) => {
            const stats = statsByPc[id];
            tileChuyenCanMap[id] = stats.total > 0 ? (stats.present / stats.total) : null;
          });
        }
      }

      classSummaries = (phancongList as unknown as DashboardPhanCong[] ?? []).map(pc => ({
        maphancong: pc.maphancong,
        tenmon: pc.monhoc?.tenmon ?? "—",
        tenlop: pc.lop?.tenlop ?? "—",
        siso: sisoMap[pc.maphancong] ?? 0,
        diemtb: diemtbMap[pc.maphancong] ?? null,
        tilechuyencan: tileChuyenCanMap[pc.maphancong] ?? null
      }));
    }

    // 5. Bài tập còn hạn
    let pendingTasks = 0;
    if (maphancongIds.length > 0) {
      const { count } = await dashboardRepo.getPendingTasksCount(maphancongIds);
      pendingTasks = count ?? 0;
    }

    // 6. Thông báo đã gửi
    const { data: gvData } = await dashboardRepo.getGiangVienMataikhoan(magv);
    const mataikhoan = gvData?.mataikhoan;

    let thongBaoList: DashboardThongBao[] = [];
    if (mataikhoan) {
      const { data } = await dashboardRepo.getThongBaoList(mataikhoan);
      thongBaoList = (data as unknown as DashboardThongBao[]) ?? [];
    }

    return {
      totalClasses,
      totalStudents,
      pendingTasks,
      classSummaries,
      thongBao: thongBaoList ?? []
    };
  },
};
