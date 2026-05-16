// repositories/sinhvien/notification.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

export const notificationRepo = {
    /**
     * Lấy danh sách thông báo dành cho sinh viên:
     * - loại "Tatca" hoặc "SinhVien" theo doituong
     * - Lọc thêm theo malop nếu thông báo gắn lớp cụ thể
     */
    getNotificationsForStudent: async (masv: string, malop: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbao')
            .select(`
                mathongbao,
                magvtao,
                maadmintao,
                tieude,
                noidung,
                loai,
                doituong,
                malop,
                maphancong,
                ngayhethan,
                ghim,
                ngaytao,
                ngaycapnhat,
                thongbaodadocsv!left(dadoc, thoigiandoc, masv)
            `)
            .or(`doituong.eq.Tatca,and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop}))`)
            .order('ghim', { ascending: false })
            .order('ngaytao', { ascending: false });
    },

    /**
     * Đếm số thông báo chưa đọc của sinh viên
     */
    getUnreadCount: async (masv: string, malop: string) => {
        const supabase = await getSupabase();
        // Lấy id các thông báo đã đọc
        const { data: read } = await supabase
            .from('thongbaodadocsv')
            .select('mathongbao')
            .eq('masv', masv)
            .eq('dadoc', true);

        const readIds = (read ?? []).map((r) => r.mathongbao);

        const query = supabase
            .from('thongbao')
            .select('mathongbao', { count: 'exact', head: true })
            .or(`doituong.eq.Tatca,and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop}))`);

        if (readIds.length > 0) {
            query.not('mathongbao', 'in', `(${readIds.join(',')})`);
        }

        return await query;
    },

    /**
     * Đánh dấu một thông báo là đã đọc (upsert vào thongbaodadocsv)
     */
    markAsRead: async (mathongbao: number, masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbaodadocsv')
            .upsert({
                mathongbao,
                masv,
                dadoc: true,
                thoigiandoc: new Date().toISOString(),
            }, {
                onConflict: 'mathongbao,masv',
            });
    },

    /**
     * Đánh dấu TẤT CẢ thông báo là đã đọc
     */
    markAllAsRead: async (masv: string, malop: string) => {
        const supabase = await getSupabase();
        // Lấy tất cả id thông báo liên quan
        const { data: all } = await supabase
            .from('thongbao')
            .select('mathongbao')
            .or(`doituong.eq.Tatca,and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop}))`);

        if (!all || all.length === 0) return { error: null };

        const upsertRows = all.map((tb) => ({
            mathongbao: tb.mathongbao,
            masv,
            dadoc: true,
            thoigiandoc: new Date().toISOString(),
        }));

        return await supabase
            .from('thongbaodadocsv')
            .upsert(upsertRows, { onConflict: 'mathongbao,masv' });
    },
};
