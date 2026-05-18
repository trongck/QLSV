// repositories/sinhvien/schedule.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

// Quy đổi số tiết → giờ bắt đầu/kết thúc
const TIET_TO_TIME: Record<number, string> = {
    1: '07:00', 2: '07:50', 3: '08:40',
    4: '09:30', 5: '10:20', 6: '11:10',
    7: '12:30', 8: '13:20', 9: '14:10',
    10: '15:00', 11: '15:50', 12: '16:40',
    13: '18:00', 14: '18:50', 15: '19:40',
};

// Thêm 50 phút cho tiết kết thúc
const TIET_END_OFFSET: Record<number, string> = {
    1: '07:50', 2: '08:40', 3: '09:30',
    4: '10:20', 5: '11:10', 6: '12:00',
    7: '13:20', 8: '14:10', 9: '15:00',
    10: '15:50', 11: '16:40', 12: '17:30',
    13: '18:50', 14: '19:40', 15: '20:30',
};

export function tietToTimeRange(tietBatDau: number, tietKetThuc: number): string {
    const start = TIET_TO_TIME[tietBatDau] ?? '07:00';
    const end = TIET_END_OFFSET[tietKetThuc] ?? '09:00';
    return `${start} - ${end}`;
}

const PHANCONG_SELECT = `
    maphancong, magv, mamon, malop, mahocky,
    monhoc:mamon ( mamon, tenmon, sotinchi ),
    giangvien:magv ( magv, hoten ),
    hocky:mahocky ( mahocky, tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc )
`;

const LICHHOC_SELECT = `
    malichhoc, maphancong, thutrongtuan,
    tietbatdau, tietketthuc, maphong, ghichu
`;

export const scheduleRepo = {
    /**
     * Lấy lịch học dạng tuần — tất cả lichhoc của sinh viên trong một học kỳ
     * Dựa trên bảng sinhvienmonhoc
     */
    getWeekSchedule: async (masv: string, mahocky?: number) => {
        const supabase = await getSupabase();

        // Nếu không truyền mahocky → dùng học kỳ đang hiệu lực
        let targetMahocky = mahocky;
        if (!targetMahocky) {
            const { data: hk } = await supabase
                .from('hocky')
                .select('mahocky')
                .eq('danghieuluc', true)
                .single();
            targetMahocky = hk?.mahocky;
        }

        if (!targetMahocky) return { data: null, error: new Error('Không tìm thấy học kỳ hiệu lực') };

        // Lấy danh sách maphancong sinh viên đang học trong kỳ
        const { data: svMonHocs, error: svmhErr } = await supabase
            .from('sinhvienmonhoc')
            .select(`
                maphancong,
                phancong!inner ( mahocky, danghieuluc, ngaybatdau, ngayketthuc )
            `)
            .eq('masv', masv)
            .eq('trangthai', 'Danghoc')
            .eq('phancong.mahocky', targetMahocky);

        if (svmhErr) return { data: null, error: svmhErr };
        if (!svMonHocs || svMonHocs.length === 0) return { data: [], error: null };

        const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
        const validSvMonHocs = svMonHocs.filter((m: any) => {
            const pc = m.phancong;
            if (!pc) return false;
            if (pc.danghieuluc === false) return false;
            if (pc.ngayketthuc) {
                const endDateStr = String(pc.ngayketthuc).split('T')[0];
                if (endDateStr < todayStr) return false;
            }
            return true;
        });

        if (validSvMonHocs.length === 0) return { data: [], error: null };
        const maphancongList = validSvMonHocs.map(m => m.maphancong);

        // Lấy lichhoc join phancong, monhoc, giangvien
        const { data, error } = await supabase
            .from('lichhoc')
            .select(`
                ${LICHHOC_SELECT},
                phancong:maphancong (
                    ${PHANCONG_SELECT}
                )
            `)
            .in('maphancong', maphancongList)
            .order('thutrongtuan', { ascending: true })
            .order('tietbatdau', { ascending: true });

        return { data, error };
    },

    /**
     * Lấy lịch học dạng học kỳ — tất cả môn học + lịch cố định theo kỳ
     */
    getSemesterSchedule: async (masv: string, mahocky: number) => {
        const supabase = await getSupabase();

        // Lấy danh sách maphancong sinh viên đang học trong kỳ
        const { data: svMonHocs, error: svmhErr } = await supabase
            .from('sinhvienmonhoc')
            .select(`
                maphancong,
                phancong!inner ( mahocky, danghieuluc, ngaybatdau, ngayketthuc )
            `)
            .eq('masv', masv)
            .eq('trangthai', 'Danghoc')
            .eq('phancong.mahocky', mahocky);

        if (svmhErr) return { data: null, error: svmhErr };
        if (!svMonHocs || svMonHocs.length === 0) return { data: [], error: null };

        const todayStr = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
        const validSvMonHocs = svMonHocs.filter((m: any) => {
            const pc = m.phancong;
            if (!pc) return false;
            if (pc.danghieuluc === false) return false;
            if (pc.ngayketthuc) {
                const endDateStr = String(pc.ngayketthuc).split('T')[0];
                if (endDateStr < todayStr) return false;
            }
            return true;
        });

        if (validSvMonHocs.length === 0) return { data: [], error: null };
        const maphancongList = validSvMonHocs.map(m => m.maphancong);

        const { data, error } = await supabase
            .from('phancong')
            .select(`
                ${PHANCONG_SELECT},
                lichhoc ( ${LICHHOC_SELECT} )
            `)
            .in('maphancong', maphancongList)
            .order('maphancong', { ascending: true });

        return { data, error };
    },

    /**
     * Danh sách học kỳ sinh viên có phân công
     */
    getHocKyList: async (masv: string) => {
        const supabase = await getSupabase();

        const { data: svMonHocs, error: svmhErr } = await supabase
            .from('sinhvienmonhoc')
            .select(`
                maphancong,
                phancong!inner ( mahocky )
            `)
            .eq('masv', masv);

        if (svmhErr) return { data: null, error: svmhErr };
        if (!svMonHocs || svMonHocs.length === 0) return { data: [], error: null };

        const mahockyIds = [...new Set(svMonHocs.map(m => (m as any).phancong?.mahocky))].filter(Boolean);

        const { data, error } = await supabase
            .from('hocky')
            .select('mahocky, tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc')
            .in('mahocky', mahockyIds)
            .order('namhoc', { ascending: false })
            .order('ky', { ascending: false });

        return { data, error };
    },

    /**
     * Học kỳ hiệu lực hiện tại
     */
    getCurrentHocKy: async () => {
        const supabase = await getSupabase();
        return await supabase
            .from('hocky')
            .select('mahocky, tenhocky, namhoc, ky, ngaybatdau, ngayketthuc, danghieuluc')
            .eq('danghieuluc', true)
            .single();
    },
};

export { TIET_TO_TIME, TIET_END_OFFSET };
