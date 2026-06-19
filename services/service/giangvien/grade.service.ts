import { gradeRepo } from "@/services/repositories/giangvien/grade.repo";

interface GradeSheetSvMonHoc {
  masv: string;
  sinhvien: { hodem: string | null; ten: string | null; malop: string } | null;
}

export const gradeService = {
  /**
   * Lưu / cập nhật 1 cột điểm cho 1 SV (check-then-insert/update)
   */
  async saveGrade(magv: string, maphancong: number, masv: string, loaidiem: string, giatri: number, heso: number, ghichu?: string) {
    // Validate giá trị điểm
    if (giatri < 0 || giatri > 10) {
      throw new Error("Điểm phải nằm trong khoảng 0 đến 10.");
    }

    const masvTrimmed = masv.trim();

    // Kiểm tra đã có điểm loại này chưa
    const { data: existing } = await gradeRepo.getExistingGrade(maphancong, masvTrimmed, loaidiem);

    if (existing) {
      const { error } = await gradeRepo.updateGrade(existing.madiem, {
        giatri,
        heso,
        ghichu: ghichu ?? null,
        magvnhap: magv,
        ngaycapnhat: new Date().toISOString()
      });
      if (error) throw error;
    } else {
      const { error } = await gradeRepo.insertGrade({
        masv: masvTrimmed,
        maphancong,
        loaidiem,
        giatri,
        heso,
        ghichu: ghichu ?? null,
        magvnhap: magv
      });
      if (error) throw error;
    }

    return true;
  },

  /**
   * Lấy danh sách lớp phân công kèm thông tin môn học, học kỳ để chọn trong GradeSheet
   */
  async getGradeClasses(magv: string) {
    const { data, error } = await gradeRepo.getGradeClasses(magv);
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Bảng điểm của giảng viên
   */
  async getGradeSheet(maphancong: number) {
    // 1. Lấy danh sách SV đang học lớp này
    const { data: svList, error: svErr } = await gradeRepo.getSinhVienMonHocList(maphancong);

    if (svErr) throw svErr;
    if (!svList || svList.length === 0) return [];

    const typedSvList = svList as unknown as GradeSheetSvMonHoc[];
    const masvList = typedSvList.map(s => s.masv);

    // 2. Lấy tất cả điểm thành phần của các SV này trong phân công này
    const { data: diemRows } = await gradeRepo.getDiemRows(maphancong, masvList);

    // 3. Lấy điểm tổng kết
    const { data: tongKetRows } = await gradeRepo.getDiemTongKetRows(maphancong, masvList);

    // 4. Lấy file nộp bài (nopbai) của sinh viên trong lớp này
    const { data: baitapList } = await gradeRepo.getBaiTapList(maphancong);

    const typedBaitapList = (baitapList as { mabaitap: number; tieude: string }[] ?? []);
    const mabaitapIds = typedBaitapList.map(b => b.mabaitap);
    
    let nopbaiRows: { masv: string; mabaitap: number; filenop: string | null }[] = [];
    if (mabaitapIds.length > 0) {
      const { data } = await gradeRepo.getNopBaiRows(mabaitapIds, masvList);
      nopbaiRows = (data as { masv: string; mabaitap: number; filenop: string | null }[] ?? []);
    }

    // 5. Gom dữ liệu theo từng SV
    const diemMap: Record<string, Record<string, { giatri: number; heso: number; madiem: number; ghichu: string | null }>> = {};
    for (const d of (diemRows as { masv: string; loaidiem: string; giatri: number; heso: number; madiem: number; ghichu: string | null }[] ?? [])) {
      if (!diemMap[d.masv]) diemMap[d.masv] = {};
      diemMap[d.masv][d.loaidiem] = { giatri: d.giatri, heso: d.heso, madiem: d.madiem, ghichu: d.ghichu };
    }

    const tongKetMap: Record<string, { masv: string; diemtongket: number | null; diemchu: string | null; ketqua: string | null }> = {};
    for (const tk of (tongKetRows as { masv: string; diemtongket: number | null; diemchu: string | null; ketqua: string | null }[] ?? [])) {
      tongKetMap[tk.masv] = tk;
    }

    return typedSvList.map((sv, idx) => {
      const student = sv.sinhvien;
      const hoten = student ? `${student.hodem || ""} ${student.ten || ""}`.trim() : "—";
      
      const studentFiles = nopbaiRows
        .filter(n => n.masv === sv.masv)
        .map(n => {
          const bt = typedBaitapList.find(b => b.mabaitap === n.mabaitap);
          return {
            tieude: bt?.tieude || `Bài tập ${n.mabaitap}`,
            filenop: n.filenop
          };
        });

      return {
        stt: idx + 1,
        masv: sv.masv,
        hoten: hoten || "—",
        malop: student?.malop ?? "—",
        diemChuyenCan: diemMap[sv.masv]?.["ChuyenCan"] ?? null,
        diemGiuaKy: diemMap[sv.masv]?.["GiuaKy"] ?? null,
        diemCuoiKy: diemMap[sv.masv]?.["CuoiKy"] ?? null,
        tongKet: tongKetMap[sv.masv] ?? null,
        nopbaiFiles: studentFiles
      };
    });
  },

  /**
   * Lưu hàng loạt điểm cho 1 SV (4 cột điểm cùng lúc) + tự tính tổng kết
   */
  async saveGradeRow(magv: string, maphancong: number, masv: string, grades: { loaidiem: string; giatri: number; heso: number }[]) {
    // Lưu từng cột điểm
    for (const g of grades) {
      if (g.giatri !== null && g.giatri !== undefined && !isNaN(g.giatri)) {
        await this.saveGrade(magv, maphancong, masv, g.loaidiem, g.giatri, g.heso);
      }
    }

    // Tính và lưu điểm tổng kết
    await this.calculateAndSaveFinalGrade(maphancong, masv);
    return true;
  },

  /**
   * Tính và lưu điểm tổng kết cho 1 SV dựa trên các điểm thành phần
   * Công thức: ChuyenCan*10% + GiuaKy*30% + CuoiKy*60%
   */
  async calculateAndSaveFinalGrade(maphancong: number, masv: string) {
    const masvTrimmed = masv.trim();

    // Lấy tất cả điểm thành phần
    const { data: diemRows } = await gradeRepo.getDiemRowsForFinal(maphancong, masvTrimmed);

    if (!diemRows || diemRows.length === 0) return;

    // Hệ số mặc định: ChuyenCan=0.1, GiuaKy=0.3, CuoiKy=0.6
    const hesoMap: Record<string, number> = {
      "ChuyenCan": 0.1,
      "GiuaKy": 0.3,
      "CuoiKy": 0.6
    };

    let tongDiem = 0;
    let tongHeSo = 0;

    for (const d of diemRows) {
      const hs = hesoMap[d.loaidiem] ?? d.heso ?? 0;
      tongDiem += d.giatri * hs;
      tongHeSo += hs;
    }

    if (tongHeSo === 0) return;

    // Tính đúng: điểm tổng kết = tổng(điểm * hệ số)
    const diemFinal = parseFloat(tongDiem.toFixed(2));

    // Quy đổi điểm chữ
    let diemChu = "F";
    if (diemFinal >= 9.0) diemChu = "A+";
    else if (diemFinal >= 8.5) diemChu = "A";
    else if (diemFinal >= 8.0) diemChu = "B+";
    else if (diemFinal >= 7.0) diemChu = "B";
    else if (diemFinal >= 6.5) diemChu = "C+";
    else if (diemFinal >= 5.5) diemChu = "C";
    else if (diemFinal >= 5.0) diemChu = "D+";
    else if (diemFinal >= 4.0) diemChu = "D";
    else diemChu = "F";

    const ketqua = diemFinal >= 4.0 ? "Dat" : "KhongDat";

    // Check-then-insert/update bảng diemtongket
    const { data: existing } = await gradeRepo.getExistingFinalGrade(maphancong, masvTrimmed);

    if (existing) {
      const { error } = await gradeRepo.updateFinalGrade(maphancong, masvTrimmed, {
        diemtongket: diemFinal,
        diemchu: diemChu,
        ketqua,
        ngaycapnhat: new Date().toISOString()
      });
      if (error) throw error;
    } else {
      const { error } = await gradeRepo.insertFinalGrade({
        masv: masvTrimmed,
        maphancong,
        diemtongket: diemFinal,
        diemchu: diemChu,
        ketqua
      });
      if (error) throw error;
    }
  },
};
