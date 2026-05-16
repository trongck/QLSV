// repositories/sinhvien/exam.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

export const examRepo = {
    /**
     * Lấy danh sách đề thi của sinh viên dựa trên phân công môn học
     */
    getExams: async (masv: string) => {
        const supabase = await getSupabase();
        console.log('Simplifying getExams for debugging...');

        // 4. Lấy danh sách đề thi (Bỏ lọc maphancong để hiển thị toàn bộ dữ liệu mẫu)
        const { data, error } = await supabase
            .from('dethi')
            .select(`
                madethi, tieude, mota, thoigianlam, thoigianbatdau, thoigianketthuc, maphancong, matkhau, solan,
                phancong:maphancong (
                    monhoc:mamon ( tenmon )
                )
            `)
            .order('thoigianbatdau', { ascending: false });

        console.log('Exams found in repo:', data?.length, error);
        if (error) return { data: null, error };

        // 3. Lấy trạng thái đã làm bài hay chưa và điểm số
        const { data: results } = await supabase
            .from('ketquathi')
            .select('madethi, trangthai, diemtong, socandung')
            .eq('masv', masv);

        const processedData = data.map(exam => {
            const result = results?.find(r => r.madethi === exam.madethi);
            return {
                ...exam,
                trangthai: result ? 'DaLam' : 'ChuaLam',
                diemtong: result?.diemtong,
                socandung: result?.socandung,
                monhoc: (exam.phancong as any)?.monhoc?.tenmon
            };
        });

        return { data: processedData, error: null };
    },

    /**
     * Lấy chi tiết đề thi (câu hỏi và các lựa chọn)
     */
    getExamDetail: async (madethi: number) => {
        const supabase = await getSupabase();

        // Lấy thông tin đề thi
        const { data: exam, error: examErr } = await supabase
            .from('dethi')
            .select('*')
            .eq('madethi', madethi)
            .single();

        if (examErr) return { data: null, error: examErr };

        // Lấy danh sách câu hỏi
        const { data: questions, error: qErr } = await supabase
            .from('cauhoi')
            .select(`
                macauhoi, noidung, hinhanh, loaicauhoi, diem, thutu,
                dapan ( madapan, noidung, thutu )
            `)
            .eq('madethi', madethi)
            .order('thutu', { ascending: true });

        if (qErr) return { data: null, error: qErr };

        return { data: { ...exam, questions }, error: null };
    },

    /**
     * Nộp bài thi
     */
    /**
     * Nộp bài thi
     */
    submitExam: async (masv: string, madethi: number, answers: { macauhoi: number, madapan: number | null, cautraloituluan: string | null }[]) => {
        const supabase = await getSupabase();
        console.log('--- START SUBMIT EXAM ---');
        console.log('MASV:', masv, 'MaDeThi:', madethi);
        console.log('Answers received:', answers.length);

        // 1. Lấy thông tin đề thi và câu hỏi
        const { data: questions, error: qErr } = await supabase
            .from('cauhoi')
            .select('macauhoi, diem, loaicauhoi')
            .eq('madethi', madethi);

        if (qErr) {
            console.error('Error fetching questions:', qErr);
            return { data: null, error: qErr };
        }

        // 2. Lấy toàn bộ đáp án đúng của các câu hỏi trong đề
        const { data: correctAnswers, error: daErr } = await supabase
            .from('dapan')
            .select('madapan, macauhoi')
            .in('macauhoi', questions.map(q => q.macauhoi))
            .eq('ladapandung', true);

        if (daErr) {
            console.error('Error fetching correct answers:', daErr);
            return { data: null, error: daErr };
        }

        let totalScore = 0;
        let correctCount = 0;

        const details = answers.map(ans => {
            const question = questions.find(q => q.macauhoi === ans.macauhoi);
            if (!question) return null;

            let isCorrect = false;
            
            if (question.loaicauhoi === 'TracNghiem') {
                // Kiểm tra xem madapan gửi lên có phải là đáp án đúng không
                isCorrect = correctAnswers.some(ca => ca.macauhoi === ans.macauhoi && ca.madapan === ans.madapan);
            } else if (question.loaicauhoi === 'NhieuLuaChon') {
                // Tạm thời xử lý như Trắc nghiệm nếu frontend chỉ gửi 1 đáp án
                isCorrect = correctAnswers.some(ca => ca.macauhoi === ans.macauhoi && ca.madapan === ans.madapan);
            }
            // Tự luận (TuLuan) sẽ được chấm sau bởi giảng viên, mặc định 0 điểm lúc này

            const score = isCorrect ? (question.diem || 0) : 0;
            
            if (isCorrect) {
                totalScore += score;
                correctCount++;
            }

            return {
                macauhoi: ans.macauhoi,
                madapan: ans.madapan,
                cautraloituluan: ans.cautraloituluan,
                diemdatduoc: score,
                dagvcham: question.loaicauhoi !== 'TuLuan'
            };
        }).filter(d => d !== null);

        // 3. Lưu kết quả thi
        const { data: result, error: resErr } = await supabase
            .from('ketquathi')
            .insert({
                madethi,
                masv,
                lanthi: 1,
                thoigianvaothi: new Date().toISOString(),
                thoigiannopbai: new Date().toISOString(),
                diemtong: totalScore,
                socandung: correctCount,
                trangthai: 'DaNop'
            })
            .select()
            .single();

        if (resErr) {
            console.error('Error inserting ketquathi:', resErr);
            return { data: null, error: resErr };
        }

        // 4. Lưu chi tiết bài làm
        const detailsToInsert = details.map(d => ({
            maketqua: result.maketqua,
            ...d
        }));

        const { error: detailErr } = await supabase
            .from('chitietbailam')
            .insert(detailsToInsert);

        if (detailErr) {
            console.error('Error inserting chitietbailam:', detailErr);
            // Có thể xóa kết quả thi vừa tạo nếu lưu chi tiết thất bại
            await supabase.from('ketquathi').delete().eq('maketqua', result.maketqua);
            return { data: null, error: detailErr };
        }

        console.log('--- SUBMIT SUCCESS --- Score:', totalScore);
        return { data: result, error: null };
    },

    /**
     * Lấy chi tiết bài làm (Câu đúng/sai)
     */
    getExamResultDetail: async (masv: string, madethi: number) => {
        const supabase = await getSupabase();

        // 1. Lấy thông tin kết quả thi
        const { data: ketqua, error: kErr } = await supabase
            .from('ketquathi')
            .select('*')
            .eq('masv', masv)
            .eq('madethi', madethi)
            .order('thoigiannopbai', { ascending: false })
            .limit(1)
            .single();

        if (kErr) return { data: null, error: kErr };

        // 2. Lấy chi tiết bài làm, câu hỏi và đáp án
        const { data: details, error: dErr } = await supabase
            .from('chitietbailam')
            .select(`
                machitiet, madapan, cautraloituluan, diemdatduoc,
                cauhoi:macauhoi (
                    macauhoi, noidung, hinhanh, loaicauhoi, diem,
                    dapan ( madapan, noidung, ladapandung )
                )
            `)
            .eq('maketqua', ketqua.maketqua);

        if (dErr) return { data: null, error: dErr };

        return { 
            data: {
                ketqua,
                details
            }, 
            error: null 
        };
    }
};
