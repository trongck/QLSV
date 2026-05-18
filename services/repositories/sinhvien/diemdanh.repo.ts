// repositories/sinhvien/diemdanh.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

// ─── Trạng thái điểm danh ────────────────────────────────────────────────────
export type TrangThaiDiemDanh = 'co_mat' | 'vang_co_phep' | 'vang_khong_phep' | 'muon';

// ─── Phương thức điểm danh ────────────────────────────────────────────────────
export type PhuongThucDiemDanh = 'qr' | 'khuon_mat' | 'thu_cong';

export interface DiemDanhRecord {
    madiemdanh: number;
    masv: string;
    mabuoihoc: number;
    thoigiandiemdanh: string;    // Đúng tên cột trong DB
    trangthai: TrangThaiDiemDanh;
    phuongthuc: PhuongThucDiemDanh;
    ghichu?: string | null;
    buoihoc?: {
        mabuoihoc: number;
        malichhoc: number;
        ngayhoc: string;
        lichhoc?: {
            malichhoc: number;
            tietbatdau: number;
            tietketthuc: number;
            maphong: string;
            maphancong: number;
            phancong?: {
                maphancong: number;
                monhoc?: { mamon: string; tenmon: string };
                giangvien?: { magv: string; hoten: string };
                hocky?: { mahocky: number; tenhocky: string; namhoc: string; ky: number };
            };
        };
    };
}

export interface AttendanceSubjectStat {
    maphancong: number;
    tenmon: string;
    mamon: string;
    sotinchi: number;
    tenhocky: string;
    total: number;
    coMat: number;
    muon: number;
    vangCoPhep: number;
    vangKhongPhep: number;
    records: any[];
}

const DIEMDANH_SELECT = `
    madiemdanh, masv, mabuoihoc, thoigiandiemdanh, trangthai, phuongthuc, ghichu,
    buoihoc:mabuoihoc (
        mabuoihoc, malichhoc, ngayhoc,
        lichhoc:malichhoc (
            malichhoc, tietbatdau, tietketthuc, maphong, thutrongtuan, maphancong,
            phancong:maphancong (
                maphancong,
                monhoc:mamon ( mamon, tenmon, sotinchi ),
                giangvien:magv ( magv, hodem, ten ),
                hocky:mahocky ( mahocky, tenhocky, namhoc, ky, ngaybatdau, ngayketthuc )
            )
        )
    )
`;

export const diemdanhRepo = {
    /**
     * Lấy toàn bộ lịch sử điểm danh của sinh viên
     * Hỗ trợ lọc theo học kỳ và theo tháng
     */
    getHistory: async (masv: string, options?: {
        mahocky?: number;
        month?: number;
        year?: number;
        maphancong?: number;
        limit?: number;
    }) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('diemdanh')
            .select(DIEMDANH_SELECT)
            .eq('masv', masv)
            .order('thoigiandiemdanh', { ascending: false }); // Sửa 'thoigian' thành 'thoigiandiemdanh'

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        // Lọc phía JS nếu cần (do join lồng nhau phức tạp)
        let filtered = data ?? [];

        if (options?.mahocky) {
            filtered = filtered.filter((d: any) =>
                d.buoihoc?.lichhoc?.phancong?.hocky?.mahocky === options.mahocky
            );
        }

        if (options?.maphancong) {
            filtered = filtered.filter((d: any) =>
                d.buoihoc?.lichhoc?.maphancong === options.maphancong
            );
        }

        if (options?.month && options?.year) {
            filtered = filtered.filter((d: any) => {
                const date = new Date(d.thoigiandiemdanh);
                return date.getMonth() + 1 === options.month && date.getFullYear() === options.year;
            });
        }

        return { data: filtered, error };
    },

    /**
     * Thống kê điểm danh theo từng môn trong một học kỳ
     */
    getStatsBySubject: async (masv: string, mahocky?: number) => {
        const supabase = await getSupabase();

        const { data, error } = await supabase
            .from('diemdanh')
            .select(DIEMDANH_SELECT)
            .eq('masv', masv)
            .order('thoigiandiemdanh', { ascending: false }); // Sửa 'thoigian' thành 'thoigiandiemdanh'

        if (error) return { data: null, error };

        // Nhóm theo môn học
        const bySubject: Record<string, AttendanceSubjectStat> = {};

        for (const dd of data ?? []) {
            const pc = (dd as any).buoihoc?.lichhoc?.phancong;
            if (!pc) continue;

            // Lọc học kỳ nếu có
            if (mahocky && pc.hocky?.mahocky !== mahocky) continue;

            const key = String(pc.maphancong);
            if (!bySubject[key]) {
                bySubject[key] = {
                    maphancong: pc.maphancong,
                    tenmon: pc.monhoc?.tenmon ?? 'Chưa có tên',
                    mamon: pc.monhoc?.mamon ?? '',
                    sotinchi: pc.monhoc?.sotinchi ?? 0,
                    tenhocky: pc.hocky?.tenhocky ?? '',
                    total: 0,
                    coMat: 0,
                    muon: 0,
                    vangCoPhep: 0,
                    vangKhongPhep: 0,
                    records: [],
                };
            }

            bySubject[key].total++;
            bySubject[key].records.push(dd);
            switch ((dd as any).trangthai as TrangThaiDiemDanh) {
                case 'co_mat': bySubject[key].coMat++; break;
                case 'muon': bySubject[key].muon++; break;
                case 'vang_co_phep': bySubject[key].vangCoPhep++; break;
                case 'vang_khong_phep': bySubject[key].vangKhongPhep++; break;
            }
        }

        return { data: Object.values(bySubject), error: null };
    },

    /**
     * Kiểm tra sinh viên đã điểm danh buổi học này chưa
     */
    checkExisting: async (masv: string, mabuoihoc: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diemdanh')
            .select('madiemdanh, trangthai, thoigiandiemdanh') // Sửa 'thoigian' thành 'thoigiandiemdanh'
            .eq('masv', masv)
            .eq('mabuoihoc', mabuoihoc)
            .maybeSingle();
    },

    /**
     * Ghi nhận điểm danh (check-in)
     */
    checkIn: async (masv: string, mabuoihoc: number | null, phuongthuc: PhuongThucDiemDanh, ghichu?: string) => {
        const supabase = await getSupabase();

        // Ghi điểm danh — không cần tính muộn nếu không có buội học
        const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        const insertData: any = {
            masv,
            thoigiandiemdanh: vnNow,
            trangthai: 'co_mat' as TrangThaiDiemDanh,
            phuongthuc,
            ghichu: ghichu ?? null,
        };

        if (mabuoihoc) {
            insertData.mabuoihoc = mabuoihoc;

            // Tính muộn nếu biết buội học
            const { data: buoi } = await supabase
                .from('buoihoc')
                .select('mabuoihoc, ngayhoc, lichhoc:malichhoc ( tietbatdau )')
                .eq('mabuoihoc', mabuoihoc)
                .maybeSingle();

            if (buoi) {
                const TIET_TO_TIME: Record<number, string> = {
                    1: '07:00', 2: '07:50', 3: '08:40', 4: '09:30',
                    5: '10:20', 6: '11:10', 7: '12:30', 8: '13:20',
                    9: '14:10', 10: '15:00', 11: '15:50', 12: '16:40',
                    13: '18:00', 14: '18:50', 15: '19:40',
                };
                const tietBD = (buoi as any).lichhoc?.tietbatdau ?? 1;
                const startStr = TIET_TO_TIME[tietBD] ?? '07:00';
                const [sh, sm] = startStr.split(':').map(Number);
                const startDate = new Date((buoi as any).ngayhoc);
                startDate.setHours(sh, sm, 0, 0);
                const diffMin = (Date.now() - startDate.getTime()) / 60000;
                if (diffMin > 15) insertData.trangthai = 'muon';
            }
        }

        return await supabase
            .from('diemdanh')
            .insert([insertData])
            .select(mabuoihoc ? DIEMDANH_SELECT : 'madiemdanh, masv, thoigiandiemdanh, trangthai, phuongthuc')
            .single();
    },

    /**
     * Lấy buổi học hôm nay của sinh viên (để hiển thị nút điểm danh)
     */
    getTodaySessions: async (masv: string) => { // Sửa malop thành masv
        const supabase = await getSupabase();
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Lấy thứ trong tuần (2=T2..8=CN)
        const dow = today.getDay(); // 0=Sun,1=Mon,...
        const thuTrongTuan = dow === 0 ? 8 : dow + 1;

        // Lấy danh sách maphancong sinh viên đang học
        const { data: svMonHocs } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', masv);
        
        if (!svMonHocs || svMonHocs.length === 0) return { data: [], error: null };
        const maphancongList = svMonHocs.map(m => m.maphancong);

        // Lấy phân công của SV trong học kỳ hiệu lực
        const { data: phanCongs } = await supabase
            .from('phancong')
            .select(`
                maphancong,
                monhoc:mamon ( mamon, tenmon ),
                giangvien:magv ( magv, hodem, ten ),
                hocky:mahocky ( mahocky, tenhocky, ngaybatdau, ngayketthuc, danghieuluc ),
                lichhoc ( malichhoc, thutrongtuan, tietbatdau, tietketthuc, maphong )
            `)
            .in('maphancong', maphancongList);

        if (!phanCongs) return { data: [], error: null };

        // Lọc lịch học hôm nay
        const todaySessions: any[] = [];
        for (const pc of phanCongs) {
            const hk = (pc as any).hocky;
            if (!hk?.danghieuluc) continue;
            const lichhocs = (pc as any).lichhoc ?? [];
            for (const lh of lichhocs) {
                if (lh.thutrongtuan === thuTrongTuan) {
                    // Tìm hoặc tạo buoihoc cho ngày hôm nay
                    const { data: buoi } = await supabase
                        .from('buoihoc')
                        .select('mabuoihoc, ngayhoc')
                        .eq('malichhoc', lh.malichhoc)
                        .eq('ngayhoc', todayStr)
                        .maybeSingle();

                    todaySessions.push({
                        ...lh,
                        maphancong: pc.maphancong,
                        monhoc: (pc as any).monhoc,
                        giangvien: (pc as any).giangvien,
                        hocky: hk,
                        mabuoihoc: buoi?.mabuoihoc ?? null,
                        ngayhoc: todayStr,
                    });
                }
            }
        }

        return { data: todaySessions, error: null };
    },

    /**
     * Lấy danh sách môn học của SV trong học kỳ (để lọc)
     */
    getSubjectList: async (masv: string, mahocky?: number) => { // Sửa malop thành masv
        const supabase = await getSupabase();

        // Lấy danh sách maphancong sinh viên đang học
        const { data: svMonHocs } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', masv);
        
        if (!svMonHocs || svMonHocs.length === 0) return { data: [], error: null };
        const maphancongList = svMonHocs.map(m => m.maphancong);

        let query = supabase
            .from('phancong')
            .select(`
                maphancong,
                monhoc:mamon ( mamon, tenmon, sotinchi ),
                hocky:mahocky ( mahocky, tenhocky, namhoc, ky, danghieuluc )
            `)
            .in('maphancong', maphancongList);

        const { data, error } = await query;

        let filtered = data ?? [];
        if (mahocky) {
            filtered = filtered.filter((pc: any) => pc.hocky?.mahocky === mahocky);
        }

        return { data: filtered, error };
    },

    /**
     * Tạo QR token cho buổi học (giáo viên tạo, SV quét)
     */
    generateQRToken: (mabuoihoc: number): string => {
        const payload = JSON.stringify({
            mabuoihoc,
            expires: Date.now() + 5 * 60 * 1000, // 5 phút
            nonce: Math.random().toString(36).slice(2),
        });
        return Buffer.from(payload).toString('base64url');
    },

    /**
     * Validate QR token
     */
    validateQRToken: (token: string): { valid: boolean; mabuoihoc?: number; error?: string } => {
        try {
            const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
            if (!payload.mabuoihoc) return { valid: false, error: 'Token không hợp lệ' };
            if (Date.now() > payload.expires) return { valid: false, error: 'Token đã hết hạn (5 phút)' };
            return { valid: true, mabuoihoc: payload.mabuoihoc };
        } catch {
            return { valid: false, error: 'Token không hợp lệ' };
        }
    },
};
