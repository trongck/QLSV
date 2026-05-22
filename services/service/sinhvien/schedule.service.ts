// services/service/sinhvien/schedule.service.ts
// Service layer cho lịch học sinh viên — gọi scheduleRepo, không truy cập DB trực tiếp.
import { scheduleRepo, tietToTimeRange } from '@/services/repositories/sinhvien/schedule.repo';

const THU_LABEL: Record<number, string> = {
    2: "Thứ 2", 3: "Thứ 3", 4: "Thứ 4",
    5: "Thứ 5", 6: "Thứ 6", 7: "Thứ 7", 8: "Chủ nhật",
};

export const scheduleService = {

    /** Lấy lịch học theo tuần của sinh viên */
    getWeekSchedule: async (masv: string, mahocky?: number) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await scheduleRepo.getWeekSchedule(masv, mahocky);
        if (error) throw new Error((error as any).message ?? 'Lỗi lấy lịch học');

        // Định dạng dữ liệu cho khớp với UI mong đợi
        const enriched = (data ?? []).map((lh: any) => {
            const pc = lh.phancong;
            if (pc && pc.giangvien) {
                pc.giangvien = {
                    ...pc.giangvien,
                    hoten: [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Giảng viên"
                };
            }
            return {
                ...lh,
                phancong: pc,
                timeRange: tietToTimeRange(lh.tietbatdau, lh.tietketthuc),
                thuLabel: THU_LABEL[lh.thutrongtuan] ?? `Thứ ${lh.thutrongtuan}`,
            };
        });

        return enriched;
    },

    /** Lấy lịch học cả học kỳ */
    getSemesterSchedule: async (masv: string, mahocky: number) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        if (!mahocky || mahocky <= 0) throw new Error('Mã học kỳ không hợp lệ');
        const { data, error } = await scheduleRepo.getSemesterSchedule(masv, mahocky);
        if (error) throw new Error(error.message);

        // Định dạng dữ liệu cho khớp với UI mong đợi
        const enriched = (data ?? []).map((pc: any) => {
            if (pc.giangvien) {
                pc.giangvien = {
                    ...pc.giangvien,
                    hoten: [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Giảng viên"
                };
            }
            return {
                ...pc,
                lichhoc: (pc.lichhoc ?? []).map((lh: any) => ({
                    ...lh,
                    timeRange: tietToTimeRange(lh.tietbatdau, lh.tietketthuc),
                    thuLabel: THU_LABEL[lh.thutrongtuan] ?? `Thứ ${lh.thutrongtuan}`,
                })).sort((a: any, b: any) => a.thutrongtuan - b.thutrongtuan || a.tietbatdau - b.tietbatdau),
            };
        });

        return enriched;
    },

    /** Lấy danh sách học kỳ */
    getHocKyList: async () => {
        const { data, error } = await scheduleRepo.getHocKyList('');
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /** Lấy học kỳ đang hiệu lực */
    getCurrentHocKy: async () => {
        const { data, error } = await scheduleRepo.getCurrentHocKy();
        if (error) throw new Error(error.message);
        return data;
    },

    getStudentScheduleData: async (masv: string, mode: string, mahockyParam: string | null) => {
        const hocKyList = await scheduleService.getHocKyList();

        let targetMahocky: number;
        if (mahockyParam) {
            targetMahocky = Number(mahockyParam);
        } else {
            const activeHk = hocKyList.find((hk) => hk.danghieuluc);
            targetMahocky = activeHk ? activeHk.mahocky : (hocKyList[0]?.mahocky ?? 0);
        }

        const hocKyHienTai = hocKyList.find((hk) => hk.mahocky === targetMahocky) ?? null;

        let scheduleData: any[] = [];
        if (mode === "semester") {
            scheduleData = await scheduleService.getSemesterSchedule(masv, targetMahocky);
        } else {
            scheduleData = await scheduleService.getWeekSchedule(masv, targetMahocky);
        }

        return {
            mode,
            mahocky: targetMahocky,
            hocKy: hocKyHienTai,
            hocKyList,
            data: scheduleData,
        };
    },
};
