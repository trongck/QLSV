// app/api/sinhvien/attendance/sessions/route.ts
// GET /api/sinhvien/attendance/sessions — buổi học hôm nay + danh sách môn
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { diemdanhService } from '@/services/service/sinhvien/diemdanh.service';
import { scheduleService } from '@/services/service/sinhvien/schedule.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
    return {
        ...sv,
        hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh Viên"
    };
}

/**
 * GET /api/sinhvien/attendance/sessions
 * Trả về:
 *  - today: buổi học hôm nay (để điểm danh)
 *  - subjects: danh sách môn trong học kỳ hiệu lực (để lọc lịch sử)
 *  - hockyList: danh sách học kỳ (để chọn)
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);

        // Lấy song song — gọi qua Service thay vì Repo trực tiếp
        const [todayData, subjectData, hockyData] = await Promise.all([
            diemdanhService.getTodaySessions(sv.masv),
            diemdanhService.getSubjectList(sv.masv),
            scheduleService.getHocKyList(),
        ]);

        const TIET_TO_TIME: Record<number, string> = {
            1: '07:00', 2: '07:50', 3: '08:40', 4: '09:30',
            5: '10:20', 6: '11:10', 7: '12:30', 8: '13:20',
            9: '14:10', 10: '15:00', 11: '15:50', 12: '16:40',
            13: '18:00', 14: '18:50', 15: '19:40',
        };
        const TIET_END: Record<number, string> = {
            1: '07:50', 2: '08:40', 3: '09:30', 4: '10:20',
            5: '11:10', 6: '12:00', 7: '13:20', 8: '14:10',
            9: '15:00', 10: '15:50', 11: '16:40', 12: '17:30',
            13: '18:50', 14: '19:40', 15: '20:30',
        };

        const todaySessions = (todayData ?? []).map((s: any) => ({
            ...s,
            timeRange: `${TIET_TO_TIME[s.tietbatdau] ?? '?'} - ${TIET_END[s.tietketthuc] ?? '?'}`,
        }));

        return NextResponse.json({
            success: true,
            today: todaySessions,
            subjects: subjectData ?? [],
            hockyList: hockyData ?? [],
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
