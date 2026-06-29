import { classRepo } from "@/services/repositories/giangvien/class.repo";
import { taskRepo } from "@/services/repositories/giangvien/task.repo";

interface ClassesPhanCong {
  maphancong: number;
  malop: string;
  malophoc: string | null;
  sisomax: number | null;
  ngaybatdau: string | null;
  ngayketthuc: string | null;
  monhoc: { mamon: string; tenmon: string; sotinchi: number } | null;
  lop: { tenlop: string; nganh: string | null } | null;
}

interface ClassesLich {
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
}

interface ClassesLichTuanItem {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  phonghoc: string | null;
  phancong: {
    maphancong: number;
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

interface ClassesTaiLieuItem {
  matailieu: number;
  tieude: string;
  loai: string;
  duongdan: string;
  dungluong: number | null;
  luotxem: number;
  chopheptai: boolean;
  ngaytao: string;
  ngaycapnhat: string;
  phancong: {
    monhoc: { tenmon: string } | null;
    lop: { tenlop: string } | null;
  } | null;
}

export const classService = {
  /**
   * Lấy toàn bộ data cho trang Lớp học (3 tab):
   *  - Tab 1: Danh sách phân công + số SV + lịch đại diện
   *  - Tab 2: Lịch dạy theo từng thứ trong tuần (7 ngày)
   *  - Tab 3: Tài liệu của tất cả lớp đang dạy
   */
  async getClassesData(magv: string, mahocky?: number | null) {
    // Lấy danh sách học kỳ
    const { data: hockyList } = await classRepo.getHocKyList();

    // Xác định học kỳ đang chọn
    let selectedHockyId: number | null = null;
    if (mahocky) {
      selectedHockyId = mahocky;
    } else {
      const activeHocky = (hockyList as any[] ?? []).find(h => h.danghieuluc === true);
      if (activeHocky) {
        selectedHockyId = activeHocky.mahocky;
      } else if (hockyList && hockyList.length > 0) {
        selectedHockyId = hockyList[0].mahocky;
      }
    }

    // ── 1. Phân công trong học kỳ được chọn ──────────────────────────────────
    const { data: phancongList } = await classRepo.getClassesPhanCong(magv, selectedHockyId);

    const maphancongIds = (phancongList as unknown as ClassesPhanCong[] ?? []).map(p => p.maphancong);

    // Đếm SV đang theo học từng lớp
    const svCountMap: Record<number, number> = {};
    if (maphancongIds.length > 0) {
      const { data: svCounts } = await classRepo.getSinhVienMonHocCounts(maphancongIds);
      for (const row of (svCounts as { maphancong: number }[] ?? [])) {
        svCountMap[row.maphancong] = (svCountMap[row.maphancong] ?? 0) + 1;
      }
    }

    // Lịch đại diện (thứ + tiết) cho mỗi phân công
    const lichMap: Record<number, { thutrongtuan: number; tietbatdau: number; tietketthuc: number; phonghoc: string | null }[]> = {};
    if (maphancongIds.length > 0) {
      const { data: lichList } = await classRepo.getLichHocRepresentative(maphancongIds);
      for (const l of (lichList as unknown as ClassesLich[] ?? [])) {
        if (!lichMap[l.maphancong]) lichMap[l.maphancong] = [];
        lichMap[l.maphancong].push(l);
      }
    }

    const dsLop = (phancongList as unknown as ClassesPhanCong[] ?? []).map(p => ({
      maphancong: p.maphancong,
      malophoc: p.malophoc ?? p.malop,
      malop: p.malop,
      tenmon: p.monhoc?.tenmon ?? "—",
      mamon: p.monhoc?.mamon ?? "—",
      sotinchi: p.monhoc?.sotinchi ?? 0,
      tenlop: p.lop?.tenlop ?? "—",
      soSinhVien: svCountMap[p.maphancong] ?? 0,
      lich: lichMap[p.maphancong] ?? [],
      ngaybatdau: p.ngaybatdau,
      ngayketthuc: p.ngayketthuc,
    }));

    // ── 2. Lịch dạy theo thứ (T2–CN) ─────────────────────────────────────────
    let lichTuan: ClassesLichTuanItem[] = [];
    if (maphancongIds.length > 0) {
      const { data: lichAll } = await classRepo.getLichTuanFull(maphancongIds);
      lichTuan = (lichAll as unknown as ClassesLichTuanItem[]) ?? [];
    }

    // ── 3. Tài liệu của tất cả lớp ──────────────────────────────────────────
    let dsTaiLieu: ClassesTaiLieuItem[] = [];
    if (maphancongIds.length > 0) {
      const { data: tailieu } = await classRepo.getTaiLieuList(maphancongIds);
      dsTaiLieu = (tailieu as unknown as ClassesTaiLieuItem[]) ?? [];
    }

    return {
      dsLop,
      lichTuan,
      dsTaiLieu,
      hockyList: hockyList ?? [],
      selectedHockyId
    };
  },

  async createTaiLieu(
    magv: string,
    data: {
      maphancong: number;
      tieude: string;
      fileBuffer: ArrayBuffer;
      fileName: string;
      contentType: string;
      size: number;
    }
  ) {
    const { data: pc } = await classRepo.checkPhanCongBelongsToTeacher(data.maphancong, magv);
    if (!pc) {
      throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");
    }

    // Upload file using taskRepo storage function
    const publicUrl = await taskRepo.uploadAttachment(data.fileName, data.fileBuffer, data.contentType);

    const { data: taiLieu, error } = await classRepo.createTaiLieu({
      maphancong: data.maphancong,
      tieude: data.tieude,
      loai: "Slide",
      duongdan: publicUrl,
      dungluong: data.size,
      luotxem: 0,
      chopheptai: true,
      ngaytao: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", ""),
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    });

    if (error) throw error;
    return taiLieu;
  },

  async deleteTaiLieu(magv: string, matailieu: number) {
    const { data: tl } = await classRepo.checkTaiLieuBelongsToTeacher(matailieu, magv);
    const typedTl = tl as any;
    if (!typedTl || typedTl.phancong?.magv !== magv) {
      throw new Error("Tài liệu không tồn tại hoặc bạn không có quyền xóa");
    }

    const { error } = await classRepo.deleteTaiLieu(matailieu);
    if (error) throw error;
    return true;
  }
};
