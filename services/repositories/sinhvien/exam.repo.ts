// services/repositories/sinhvien/exam.repo.ts
// Repo layer: CHỈ chứa Supabase queries, không có business logic.
import { getSupabaseClient } from '@/lib/utils/supabase/server';

async function getSupabase() {
    return await getSupabaseClient();
}

export const examRepo = {

    /**
     * Lấy danh sách đề thi (raw data)
     */
    getExams: async () => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('dethi')
            .select(`
                madethi, tieude, mota, thoigianlam, thoigianbatdau, thoigianketthuc, maphancong, matkhau, solan,
                phancong:maphancong (
                    monhoc:mamon ( tenmon )
                )
            `)
            .order('thoigianbatdau', { ascending: false });

        return { data, error };
    },

    /**
     * Lấy kết quả thi của sinh viên để merge với danh sách đề thi
     */
    getExamResultsByStudent: async (masv: string) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('ketquathi')
            .select('madethi, trangthai, diemtong, socandung')
            .eq('masv', masv);

        return { data, error };
    },

    /**
     * Lấy chi tiết đề thi
     */
    getExamDetail: async (madethi: number) => {
        const supabase = await getSupabase();

        const { data: exam, error: examErr } = await supabase
            .from('dethi')
            .select('*')
            .eq('madethi', madethi)
            .single();

        if (examErr) return { data: null, error: examErr };

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
     * Lấy danh sách câu hỏi (diem, loaicauhoi) để tính điểm
     */
    getQuestionsByExam: async (madethi: number) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('cauhoi')
            .select('macauhoi, diem, loaicauhoi')
            .eq('madethi', madethi);

        return { data, error };
    },

    /**
     * Lấy tất cả đáp án đúng của một tập câu hỏi
     */
    getCorrectAnswers: async (macauhoisList: number[]) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('dapan')
            .select('madapan, macauhoi')
            .in('macauhoi', macauhoisList)
            .eq('ladapandung', true);

        return { data, error };
    },

    /**
     * Lưu bản ghi kết quả thi (ketquathi)
     */
    insertKetQua: async (payload: {
        madethi: number;
        masv: string;
        lanthi: number;
        thoigianvaothi: string;
        thoigiannopbai: string;
        diemtong: number;
        socandung: number;
        trangthai: string;
        ghichu: string | null;
    }) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('ketquathi')
            .insert(payload)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Lưu chi tiết bài làm (chitietbailam)
     */
    insertChiTietBaiLam: async (details: {
        maketqua: number;
        macauhoi: number;
        madapan: number | null;
        cautraloituluan: string | null;
        diemdatduoc: number;
        dagvcham: boolean;
    }[]) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('chitietbailam')
            .insert(details);

        return { data, error };
    },

    /**
     * Xóa kết quả thi (dùng khi rollback)
     */
    deleteKetQua: async (maketqua: number) => {
        const supabase = await getSupabase();
        const { error } = await supabase
            .from('ketquathi')
            .delete()
            .eq('maketqua', maketqua);

        return { error };
    },

    /**
     * Lấy thông tin kết quả thi của sinh viên cho một đề thi
     */
    getKetQua: async (masv: string, madethi: number) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('ketquathi')
            .select('*')
            .eq('masv', masv)
            .eq('madethi', madethi)
            .order('thoigiannopbai', { ascending: false })
            .limit(1)
            .single();

        return { data, error };
    },

    /**
     * Lấy chi tiết bài làm (câu đúng/sai) theo maketqua
     */
    getChiTietBaiLam: async (maketqua: number) => {
        const supabase = await getSupabase();
        const { data, error } = await supabase
            .from('chitietbailam')
            .select(`
                machitiet, madapan, cautraloituluan, diemdatduoc,
                cauhoi:macauhoi (
                    macauhoi, noidung, hinhanh, loaicauhoi, diem,
                    dapan ( madapan, noidung, ladapandung )
                )
            `)
            .eq('maketqua', maketqua);

        return { data, error };
    },
};
