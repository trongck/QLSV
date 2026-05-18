// services/sinhvien/notification.service.ts
import { notificationRepo } from '@/services/repositories/sinhvien/notification.repo';

export const notificationSVService = {
    /**
     * Lấy toàn bộ thông báo dành cho sinh viên.
     * Mỗi item có ngaytao; nếu ngaycapnhat khác ngaytao thì đã cập nhật.
     */
    getAll: async (mataikhoan: string, malop: string) => {
        if (!mataikhoan || !malop) throw new Error('Thiếu thông tin người dùng');

        const { data, error } = await notificationRepo.getNotificationsForStudent(mataikhoan, malop);
        if (error) throw new Error(error.message);

        // Đánh dấu "đã cập nhật" và "đã đọc" cho mỗi thông báo
        const result = (data ?? []).map((tb: any) => {
            const readRecord = Array.isArray(tb.thongbaodadoc)
                ? tb.thongbaodadoc.find((r: any) => r.mataikhoan === mataikhoan)
                : null;

            return {
                ...tb,
                dadoc: readRecord?.dadoc ?? false,
                thoigiandoc: readRecord?.thoigiandoc ?? null,
                dacapnhat: tb.ngaycapnhat && tb.ngaytao
                    ? new Date(tb.ngaycapnhat).getTime() - new Date(tb.ngaytao).getTime() > 1000
                    : false,
            };
        });

        return result;
    },

    /**
     * Đếm số thông báo chưa đọc (dùng cho badge)
     */
    getUnreadCount: async (mataikhoan: string, malop: string) => {
        if (!mataikhoan || !malop) return 0;
        const { count, error } = await notificationRepo.getUnreadCount(mataikhoan, malop);
        if (error) throw new Error(error.message);
        return count ?? 0;
    },

    /**
     * Đánh dấu một thông báo đã đọc
     */
    markAsRead: async (mathongbao: number, mataikhoan: string) => {
        if (!mathongbao || !mataikhoan) throw new Error('Thiếu thông tin');
        const { error } = await notificationRepo.markAsRead(mathongbao, mataikhoan);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    markAllAsRead: async (mataikhoan: string, malop: string) => {
        if (!mataikhoan || !malop) throw new Error('Thiếu thông tin người dùng');
        const { error } = await notificationRepo.markAllAsRead(mataikhoan, malop);
        if (error) throw new Error(error.message);
        return { success: true };
    },
};
