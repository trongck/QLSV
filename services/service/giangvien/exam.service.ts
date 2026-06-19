import { examRepo } from "@/services/repositories/giangvien/exam.repo";
import { DeThi } from "@/types";

interface ExamPhanCong {
  maphancong: number;
  monhoc: { tenmon: string } | null;
  lop: { tenlop: string } | null;
}

export const examService = {
  /**
   * Cập nhật toàn diện đề thi (Thông tin cơ bản và câu hỏi nếu có file mới)
   */
  async updateExamFull(
    magv: string,
    madethi: number,
    examData: {
      maphancong: number;
      tieude: string;
      mota: string;
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
      matkhau: string;
    },
    newQuestions?: Array<{
      noidung: string;
      diem: number;
      dapan: Array<{ noidung: string; ladapandung: boolean }>;
    }>
  ) {
    // Validate quyền (phải là đề thi của GV này)
    const { data: dethiCheck } = await examRepo.getExamCheck(madethi);

    if (!dethiCheck || (dethiCheck.phancong as unknown as { magv: string }).magv !== magv) {
      throw new Error("Không tìm thấy đề thi hoặc bạn không có quyền");
    }

    // Validate lớp học phần mới
    const { data: pcCheck } = await examRepo.checkPhanCongBelongsToTeacher(examData.maphancong, magv);

    if (!pcCheck) {
      throw new Error("Phân công mới không hợp lệ");
    }

    // 1. Cập nhật thông tin đề thi
    const { error: examError } = await examRepo.updateExamInfo(madethi, {
      maphancong: examData.maphancong,
      tieude: examData.tieude,
      mota: examData.mota,
      thoigianlam: examData.thoigianlam,
      thoigianbatdau: examData.thoigianbatdau,
      thoigianketthuc: examData.thoigianketthuc,
      matkhau: examData.matkhau
    });

    if (examError) throw examError;

    // 2. Cập nhật câu hỏi nếu có newQuestions
    if (newQuestions && newQuestions.length > 0) {
      // Xóa câu hỏi cũ (cascade sẽ xóa đáp án cũ)
      const { error: delError } = await examRepo.deleteCauHoiByExam(madethi);

      if (delError) throw delError;

      // Chèn câu hỏi mới
      for (let i = 0; i < newQuestions.length; i++) {
        const q = newQuestions[i];
        const { data: newQ, error: qError } = await examRepo.insertCauHoi({
          madethi,
          noidung: q.noidung,
          loaicauhoi: "TracNghiem",
          diem: q.diem || 0.2,
          thutu: i + 1
        });

        if (qError) throw qError;

        const dapanInserts = q.dapan.map((d, dIdx) => ({
          macauhoi: newQ.macauhoi,
          noidung: d.noidung,
          ladapandung: d.ladapandung,
          thutu: dIdx + 1
        }));

        const { error: dError } = await examRepo.insertDapAnBatch(dapanInserts);

        if (dError) throw dError;
      }
    }

    return true;
  },

  /**
   * Lấy danh sách các bài thi trực tuyến (đề thi) của giảng viên
   */
  async getExams(magv: string) {
    // 1. Lấy danh sách phân công
    const { data: phancongList } = await examRepo.getExamsPhanCong(magv);

    const typedPhancongList = phancongList as unknown as ExamPhanCong[] ?? [];
    const maphancongIds = typedPhancongList.map(pc => pc.maphancong);

    if (maphancongIds.length === 0) return [];

    // 2. Lấy các đề thi thuộc các lớp này
    const { data: exams, error } = await examRepo.getExamsList(maphancongIds);

    if (error) throw error;

    const typedExams = exams as unknown as (DeThi & { tenlop?: string; tenmon?: string })[] ?? [];

    // Map lại thông tin lớp cho mỗi exam
    return typedExams.map(exam => {
      const pc = typedPhancongList.find(p => p.maphancong === exam.maphancong);
      return {
        ...exam,
        tenlop: pc?.lop?.tenlop || "Không rõ",
        tenmon: pc?.monhoc?.tenmon || "Không rõ"
      };
    });
  },

  /**
   * Kết thúc ca thi trực tuyến (cập nhật thoigianketthuc = now)
   */
  async endExam(magv: string, madethi: number) {
    // Validate quyền
    const { data: phancongList } = await examRepo.getPhanCongList(magv);
    
    const maphancongIds = (phancongList as { maphancong: number }[] ?? []).map(pc => pc.maphancong);

    const { data: examCheck } = await examRepo.getExamCheckInPhanCong(madethi, maphancongIds);

    if (!examCheck) {
      throw new Error("Không tìm thấy bài thi hoặc không có quyền");
    }

    const { error } = await examRepo.endExam(madethi, new Date().toISOString());

    if (error) throw error;
    return true;
  },

  /**
   * Tạo đề thi mới và thêm các câu hỏi/đáp án đi kèm
   */
  async createExamWithQuestions(
    magv: string,
    examData: {
      maphancong: number;
      tieude: string;
      mota: string;
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
      matkhau: string;
    },
    questions: Array<{
      noidung: string;
      diem: number;
      dapan: Array<{ noidung: string; ladapandung: boolean }>;
    }>
  ) {
    // Validate quyền
    const { data: pcCheck } = await examRepo.checkPhanCongBelongsToTeacher(examData.maphancong, magv);

    if (!pcCheck) {
      throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");
    }

    // 1. Tạo đề thi
    const { data: newExam, error: examError } = await examRepo.createExam({
      maphancong: examData.maphancong,
      tieude: examData.tieude,
      mota: examData.mota,
      thoigianlam: examData.thoigianlam,
      thoigianbatdau: examData.thoigianbatdau,
      thoigianketthuc: examData.thoigianketthuc,
      matkhau: examData.matkhau,
      xaotroncauhoi: false,
      xaotrondapan: false,
      solan: 1,
      hienthidapan: true,
      ngaytao: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", ""),
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    });

    if (examError) throw examError;
    const madethi = newExam.madethi;

    // 2. Chèn các câu hỏi và đáp án
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: newQ, error: qError } = await examRepo.insertCauHoi({
        madethi,
        noidung: q.noidung,
        loaicauhoi: "TracNghiem",
        diem: q.diem || 0.2,
        thutu: i + 1
      });

      if (qError) throw qError;

      // Chèn các đáp án của câu hỏi
      const dapanInserts = q.dapan.map((d, dIdx) => ({
        macauhoi: newQ.macauhoi,
        noidung: d.noidung,
        ladapandung: d.ladapandung,
        thutu: dIdx + 1
      }));

      const { error: dError } = await examRepo.insertDapAnBatch(dapanInserts);

      if (dError) throw dError;
    }

    return { madethi };
  },

  /**
   * Cập nhật thời gian thi
   */
  async updateExamTime(
    magv: string,
    madethi: number,
    timeData: {
      thoigianlam: number;
      thoigianbatdau: string;
      thoigianketthuc: string;
    }
  ) {
    // Validate quyền
    const { data: pcCheck } = await examRepo.getPhanCongList(magv);
    const maphancongIds = (pcCheck as { maphancong: number }[] ?? []).map(p => p.maphancong);

    const { data: examCheck } = await examRepo.getExamCheckInPhanCong(madethi, maphancongIds);

    if (!examCheck) {
      throw new Error("Không tìm thấy đề thi hoặc bạn không có quyền chỉnh sửa");
    }

    const { error } = await examRepo.updateExamInfo(madethi, {
      thoigianlam: timeData.thoigianlam,
      thoigianbatdau: timeData.thoigianbatdau,
      thoigianketthuc: timeData.thoigianketthuc,
      ngaycapnhat: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "")
    });

    if (error) throw error;
    return true;
  },
};
