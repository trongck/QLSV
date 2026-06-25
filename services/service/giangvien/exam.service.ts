import { examRepo } from "@/services/repositories/giangvien/exam.repo";
import { notificationRepo } from "@/services/repositories/giangvien/notification.repo";
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

  /**
   * Tạo đề thi và gửi thông báo tới toàn bộ SV trong lớp
   */
  async createExamAndNotify(
    magv: string,
    mataikhoangv: string,
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
    // 1. Tạo đề thi đầy đủ câu hỏi (gọi thẳng vào repo, không circular)
    // Validate quyền
    const { data: pcCheck } = await examRepo.checkPhanCongBelongsToTeacher(examData.maphancong, magv);
    if (!pcCheck) throw new Error("Phân công không hợp lệ hoặc bạn không có quyền");

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
      const dapanInserts = q.dapan.map((d: any, dIdx: number) => ({
        macauhoi: newQ.macauhoi,
        noidung: d.noidung,
        ladapandung: d.ladapandung,
        thutu: dIdx + 1
      }));
      const { error: dError } = await examRepo.insertDapAnBatch(dapanInserts);
      if (dError) throw dError;
    }

    const result = { madethi };

    // 2. Gửi thông báo tới SV trong lớp
    try {
      const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
      const startStr = new Date(examData.thoigianbatdau).toLocaleString("vi-VN", {
        hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric"
      });
      await notificationRepo.createNotification({
        tieude: `Ủ Ca thi: ${examData.tieude}`,
        noidung: `Ca thi sẽ bắt đầu lúc ${startStr}. Thời lượng: ${examData.thoigianlam} phút. Vui lòng chuẩn bị sẵn sàng.`,
        loai: "Hoctap",
        doituong: "SinhVien",
        maphancong: examData.maphancong,
        malop: null,
        ghim: false,
        mataikhoantao: mataikhoangv,
        ngaytao: nowVN,
        ngaycapnhat: nowVN,
      });
    } catch (notifErr) {
      // Không để lỗi thông báo fail ảnh hưởng tạo đề thi
      console.error("[createExamAndNotify] Lỗi gửi thông báo:", notifErr);
    }

    return result;
  },

  /**
   * Lấy dữ liệu monitoring: toàn bộ SV trong lớp + trạng thái hiện tại
   */
  async getExamMonitoringData(magv: string, madethi: number) {
    // Validate quyền
    const { data: examFull } = await examRepo.getExamWithPhanCong(madethi);
    if (!examFull) throw new Error("Không tìm thấy đề thi");
    const pc = examFull.phancong as any;
    if (!pc || pc.magv !== magv) throw new Error("Không có quyền truy cập");

    const maphancong = (examFull as any).maphancong;

    // Lấy danh sách tất cả SV trong lớp
    const { data: svList } = await examRepo.getStudentsByPhanCong(maphancong);
    const allStudents = ((svList || []) as any[]).map((row: any) => row.sinhvien);

    // Lấy kết quả thi hiện tại
    const { data: ketquaList } = await examRepo.getKetQuaThiByExam(madethi);
    const ketquaMap = new Map<string, any>();
    for (const kq of (ketquaList || [])) {
      const kqSv = kq.sinhvien as any;
      if (kqSv?.masv) ketquaMap.set(kqSv.masv, kq);
    }

    // Map từng SV
    const students = allStudents.map((sv: any) => {
      const kq = ketquaMap.get(sv.masv);
      return {
        masv: sv.masv,
        hoten: `${sv.hodem || ""} ${sv.ten || ""}`.trim() || sv.masv,
        trangthai: kq ? kq.trangthai : "ChuaVao",
        socauhoi: (examFull as any).cauhoi?.length ?? 0,
        diemtong: kq?.diemtong ?? null,
        maketqua: kq?.maketqua ?? null,
        thoigiannopbai: kq?.thoigiannopbai ?? null,
      };
    });

    const stats = {
      tongSV: students.length,
      chuaVao: students.filter((s: any) => s.trangthai === "ChuaVao").length,
      dangLam: students.filter((s: any) => s.trangthai === "DangLam").length,
      daNop: students.filter((s: any) => s.trangthai === "DaNop").length,
      hetGio: students.filter((s: any) => s.trangthai === "HetGio").length,
      viPham: students.filter((s: any) => s.trangthai === "ViPham").length,
    };

    return {
      exam: {
        madethi,
        tieude: (examFull as any).tieude,
        thoigianbatdau: (examFull as any).thoigianbatdau,
        thoigianketthuc: (examFull as any).thoigianketthuc,
        thoigianlam: (examFull as any).thoigianlam,
        tenmon: pc?.monhoc?.tenmon ?? "",
        tenlop: pc?.lop?.tenlop ?? "",
      },
      stats,
      students,
    };
  },

  /**
   * Force-end ca thi: đưa tất cả DangLam → HetGio, cập nhật thoigianketthuc=now
   */
  async forceEndExam(magv: string, madethi: number) {
    // Validate quyền
    const { data: phancongList } = await examRepo.getPhanCongList(magv);
    const maphancongIds = (phancongList as { maphancong: number }[] ?? []).map(pc => pc.maphancong);
    const { data: examCheck } = await examRepo.getExamCheckInPhanCong(madethi, maphancongIds);
    if (!examCheck) throw new Error("Không tìm thấy bài thi hoặc không có quyền");

    const nowStr = new Date().toISOString();
    // Kết thúc tất cả bài đang làm
    await examRepo.forceEndAllActiveBai(madethi);
    // Cập nhật thoigianketthuc
    await examRepo.endExam(madethi, nowStr);
    return true;
  },

  /**
   * Lấy lịch sử tất cả ca thi của GV, phân loại upcoming/ended
   */
  async getExamHistory(magv: string) {
    const { data: exams, error } = await examRepo.getExamsByTeacherFull(magv);
    if (error) throw error;

    const now = new Date();
    const allExams = ((exams || []) as any[]).map((exam: any) => ({
      ...exam,
      tenmon: exam.phancong?.monhoc?.tenmon ?? "Không rõ",
      tenlop: exam.phancong?.lop?.tenlop ?? "Không rõ",
    }));

    return {
      upcoming: allExams.filter(e => new Date(e.thoigianketthuc) > now),
      ended: allExams.filter(e => new Date(e.thoigianketthuc) <= now),
    };
  },
};
