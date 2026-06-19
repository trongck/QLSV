// services/service/sinhvien/exam.service.ts
// Service layer: chứa business logic, validate dữ liệu, gọi examRepo.
import { examRepo } from '@/services/repositories/sinhvien/exam.repo';

export const examService = {

    /** Lấy danh sách đề thi của sinh viên */
    getExams: async (masv: string) => {
        if (!masv?.trim()) throw new Error('Mã sinh viên không hợp lệ');

        const { data: exams, error: examErr } = await examRepo.getExams();
        if (examErr) throw new Error(examErr.message);

        const { data: results, error: resErr } = await examRepo.getExamResultsByStudent(masv);
        if (resErr) throw new Error(resErr.message);

        // Merge trạng thái đã làm bài
        const processed = (exams ?? []).map(exam => {
            const result = results?.find(r => r.madethi === exam.madethi);
            return {
                ...exam,
                trangthai: result ? 'DaLam' : 'ChuaLam',
                diemtong: result?.diemtong ?? null,
                socandung: result?.socandung ?? null,
                monhoc: (exam.phancong as any)?.monhoc?.tenmon ?? null,
            };
        });

        return processed;
    },

    /** Lấy chi tiết đề thi và câu hỏi */
    getExamDetail: async (madethi: number) => {
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');

        const { data, error } = await examRepo.getExamDetail(madethi);
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Không tìm thấy đề thi');

        return data;
    },

    /** Nộp bài thi — tính điểm tại Service, Repo chỉ insert */
    submitExam: async (
        masv: string,
        madethi: number,
        answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
        cheatCount?: number
    ) => {
        // --- Validate ---
        if (!masv?.trim()) throw new Error('Mã sinh viên không hợp lệ');
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');
        if (!Array.isArray(answers) || answers.length === 0) throw new Error('Không có câu trả lời nào được gửi');

        // --- Lấy câu hỏi ---
        const { data: questions, error: qErr } = await examRepo.getQuestionsByExam(madethi);
        if (qErr || !questions) throw new Error(qErr?.message ?? 'Không thể tải câu hỏi');

        // --- Lấy đáp án đúng ---
        const macauhoisList = questions.map(q => q.macauhoi);
        const { data: correctAnswers, error: daErr } = await examRepo.getCorrectAnswers(macauhoisList);
        if (daErr || !correctAnswers) throw new Error(daErr?.message ?? 'Không thể tải đáp án');

        // --- Business Logic: Tính điểm ---
        let totalScore = 0;
        let correctCount = 0;

        const details = answers.map(ans => {
            const question = questions.find(q => q.macauhoi === ans.macauhoi);
            if (!question) return null;

            let isCorrect = false;

            if (question.loaicauhoi === 'TracNghiem' || question.loaicauhoi === 'NhieuLuaChon') {
                isCorrect = correctAnswers.some(
                    ca => ca.macauhoi === ans.macauhoi && ca.madapan === ans.madapan
                );
            }
            // TuLuan: mặc định 0 điểm, chờ giảng viên chấm thủ công

            const score = isCorrect ? (question.diem ?? 0) : 0;
            if (isCorrect) {
                totalScore += score;
                correctCount++;
            }

            return {
                macauhoi: ans.macauhoi,
                madapan: ans.madapan,
                cautraloituluan: ans.cautraloituluan,
                diemdatduoc: score,
                dagvcham: question.loaicauhoi !== 'TuLuan',
            };
        }).filter((d): d is NonNullable<typeof d> => d !== null);

        // --- Xác định trạng thái gian lận ---
        const isCheat = cheatCount != null && cheatCount > 0;
        const trangthai = isCheat ? 'ViPham' : 'DaNop';
        const ghichu = isCheat ? `Đã rời màn hình thi ${cheatCount} lần` : null;
        const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace('Z', '');

        // --- Insert kết quả thi ---
        const { data: result, error: resErr } = await examRepo.insertKetQua({
            madethi,
            masv,
            lanthi: 1,
            thoigianvaothi: vnNow,
            thoigiannopbai: vnNow,
            diemtong: totalScore,
            socandung: correctCount,
            trangthai,
            ghichu,
        });

        if (resErr || !result) throw new Error(resErr?.message ?? 'Không thể lưu kết quả thi');

        // --- Insert chi tiết bài làm ---
        const detailsToInsert = details.map(d => ({
            maketqua: result.maketqua,
            ...d,
        }));

        const { error: detailErr } = await examRepo.insertChiTietBaiLam(detailsToInsert);

        if (detailErr) {
            // Rollback: xóa kết quả thi nếu insert chi tiết thất bại
            await examRepo.deleteKetQua(result.maketqua);
            throw new Error(detailErr.message ?? 'Không thể lưu chi tiết bài làm');
        }

        return result;
    },

    /** Lấy chi tiết kết quả bài làm */
    getExamResultDetail: async (masv: string, madethi: number) => {
        if (!masv?.trim()) throw new Error('Mã sinh viên không hợp lệ');
        if (!madethi || madethi <= 0) throw new Error('Mã đề thi không hợp lệ');

        const { data: ketqua, error: kErr } = await examRepo.getKetQua(masv, madethi);
        if (kErr) throw new Error(kErr.message);
        if (!ketqua) throw new Error('Không tìm thấy kết quả thi');

        const { data: details, error: dErr } = await examRepo.getChiTietBaiLam(ketqua.maketqua);
        if (dErr) throw new Error(dErr.message);

        return { ketqua, details };
    },
};
