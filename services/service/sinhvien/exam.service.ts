// services/service/sinhvien/exam.service.ts
// Service layer cho bài thi sinh viên — gọi examRepo, không truy cập DB trực tiếp.
import { examRepo } from '@/services/repositories/sinhvien/exam.repo';

export const examService = {

    /** Lấy danh sách đề thi của sinh viên */
    getExams: async (masv: string) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await examRepo.getExams(masv);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /** Lấy chi tiết đề thi và câu hỏi */
    getExamDetail: async (madethi: number) => {
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');
        const { data, error } = await examRepo.getExamDetail(madethi);
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Không tìm thấy đề thi');
        return data;
    },

    /** Nộp bài thi */
    submitExam: async (
        masv: string,
        madethi: number,
        answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
        cheatCount?: number
    ) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');
        if (!Array.isArray(answers) || answers.length === 0) throw new Error('Không có câu trả lời nào được gửi');

        const { data, error } = await examRepo.submitExam(masv, madethi, answers, cheatCount);
        if (error) throw new Error(error.message);
        return data;
    },

    /** Lấy chi tiết kết quả bài làm */
    getExamResultDetail: async (masv: string, madethi: number) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');
        const { data, error } = await examRepo.getExamResultDetail(masv, madethi);
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Không tìm thấy kết quả thi');
        return data;
    },
};
