// services/sinhvien/notification.service.ts
import { notificationRepo } from '@/services/repositories/sinhvien/notification.repo';
import { studentRepo } from '@/services/repositories/sinhvien/student.repo';

const parseToVNTimeMs = (dateInput: string | Date) => {
    if (dateInput instanceof Date) {
        return dateInput.getTime();
    }
    let str = dateInput.trim().replace(' ', 'T');
    // Nếu chuỗi thời gian chưa định nghĩa múi giờ (không chứa Z, +, -xx:xx)
    // chúng ta sẽ ép buộc nó thuộc múi giờ Đông Dương (+07:00)
    if (!str.includes('Z') && !str.includes('+') && !/-\d{2}:\d{2}$/.test(str)) {
        str = str + '+07:00';
    }
    return new Date(str).getTime();
};

export const notificationSVService = {
    /**
     * Lấy toàn bộ thông báo dành cho sinh viên.
     * Mỗi item có ngaytao; nếu ngaycapnhat khác ngaytao thì đã cập nhật.
     */
    getAll: async (mataikhoan: string) => {
        if (!mataikhoan) throw new Error('Thiếu thông tin người dùng');

        const { data: sv, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
        const { masv, malop } = sv;

        const { data: monHocData } = await studentRepo.getMonHocDangHoc(masv);
        const maphancongList = (monHocData || []).map((item: any) => item.maphancong);

        const { data, error } = await notificationRepo.getNotificationsForStudent(mataikhoan, malop, maphancongList);
        if (error) throw new Error(error.message);

        const now = new Date();

        // Lọc thông báo:
        // - Ngày tạo phải bé hơn hoặc bằng thời gian hiện tại (không hiển thị các thông báo hẹn lịch trong tương lai)
        // - Ngày hết hạn nếu có thì phải lớn hơn hoặc bằng thời gian hiện tại (không hiển thị các thông báo đã hết hạn)
        const filteredData = (data ?? []).filter((tb: any) => {
            const ngaytaoTime = tb.ngaytao ? parseToVNTimeMs(tb.ngaytao) : 0;
            const ngayhethanTime = tb.ngayhethan ? parseToVNTimeMs(tb.ngayhethan) : null;

            if (ngaytaoTime > now.getTime()) {
                return false;
            }

            if (ngayhethanTime !== null && ngayhethanTime < now.getTime()) {
                return false;
            }

            return true;
        });

        // Đánh dấu "đã cập nhật" và "đã đọc" cho mỗi thông báo
        const result = filteredData.map((tb: any) => {
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
    getUnreadCount: async (mataikhoan: string) => {
        if (!mataikhoan) return 0;
        try {
            const list = await notificationSVService.getAll(mataikhoan);
            return list.filter((tb: any) => !tb.dadoc).length;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Đánh dấu một thông báo đã đọc
     */
    markAsRead: async (mathongbao: number, mataikhoan: string) => {
        if (!mathongbao || !mataikhoan) throw new Error('Thiếu thông tin');
        const { data: sv, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !sv) throw new Error('Không tìm thấy thông tin sinh viên');

        const { error } = await notificationRepo.markAsRead(mathongbao, mataikhoan);
        if (error) throw new Error(error.message);
        return { success: true };
    },

    /**
     * Đánh dấu tất cả thông báo đã đọc
     */
    markAllAsRead: async (mataikhoan: string) => {
        if (!mataikhoan) throw new Error('Thiếu thông tin người dùng');
        const { data: sv, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !sv) throw new Error('Không tìm thấy thông tin sinh viên');

        const { data: monHocData } = await studentRepo.getMonHocDangHoc(sv.masv);
        const maphancongList = (monHocData || []).map((item: any) => item.maphancong);

        const { error } = await notificationRepo.markAllAsRead(mataikhoan, sv.malop, maphancongList);
        if (error) throw new Error(error.message);
        return { success: true };
    },
};
