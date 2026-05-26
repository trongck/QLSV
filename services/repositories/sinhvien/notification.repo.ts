// repositories/sinhvien/notification.repo.ts
import { getSupabaseClient } from '@/lib/utils/supabase/server';

async function getSupabase() {
    return await getSupabaseClient();
}


export const notificationRepo = {
    /**
     * Lấy danh sách thông báo dành cho sinh viên:
     * - loại "Tatca" hoặc "SinhVien" theo doituong
     * - Lọc thêm theo malop nếu thông báo gắn lớp cụ thể
     */
    getNotificationsForStudent: async (mataikhoan: string, malop: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbao')
            .select(`
                mathongbao,
                mataikhoantao,
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
                thongbaodadoc!left(dadoc, thoigiandoc, mataikhoan)
            `)
            .or(`doituong.eq.Tatca,and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop}))`)
            .order('ghim', { ascending: false })
            .order('ngaytao', { ascending: false });
    },

    /**
     * Đếm số thông báo chưa đọc của sinh viên
     */
    getUnreadCount: async (mataikhoan: string, malop: string) => {
        const supabase = await getSupabase();
        const { data: read } = await supabase
            .from('thongbaodadoc')
            .select('mathongbao')
            .eq('mataikhoan', mataikhoan)
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
     markAsRead: async (mathongbao: number, mataikhoan: string) => {
        const supabase = await getSupabase();
        const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        return await supabase
            .from('thongbaodadoc')
            .upsert({
                mathongbao,
                mataikhoan,
                dadoc: true,
                thoigiandoc: vnNow,
            }, {
                onConflict: 'mathongbao,mataikhoan',
            });
    },

    /**
     * Đánh dấu TẤT CẢ thông báo là đã đọc
     */
    markAllAsRead: async (mataikhoan: string, malop: string) => {
        const supabase = await getSupabase();
        const { data: all } = await supabase
            .from('thongbao')
            .select('mathongbao')
            .or(`doituong.eq.Tatca,and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop}))`);

        if (!all || all.length === 0) return { error: null };

        const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        const upsertRows = all.map((tb) => ({
            mathongbao: tb.mathongbao,
            mataikhoan,
            dadoc: true,
            thoigiandoc: vnNow,
        }));

        return await supabase
            .from('thongbaodadoc')
            .upsert(upsertRows, { onConflict: 'mathongbao,mataikhoan' });
    },
};
