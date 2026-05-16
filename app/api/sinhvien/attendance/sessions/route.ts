// app/api/sinhvien/attendance/sessions/route.ts
// GET /api/sinhvien/attendance/sessions — buổi học hôm nay + danh sách môn
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { diemdanhRepo } from '@/services/repositories/sinhvien/diemdanh.repo';
import { scheduleRepo } from '@/services/repositories/sinhvien/schedule.repo';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: sv, error } = await supabase
        .from('sinhvien')
        .select('masv, malop, hoten')
        .eq('mataikhoan', payload.mataikhoan)
        .single();
    if (error || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
    return sv;
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

        // Lấy song song
        const [todayResult, subjectResult, hockyResult] = await Promise.all([
            diemdanhRepo.getTodaySessions(sv.masv),
            diemdanhRepo.getSubjectList(sv.masv),
            scheduleRepo.getHocKyList(sv.masv),
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

        const todaySessions = (todayResult.data ?? []).map((s: any) => ({
            ...s,
            timeRange: `${TIET_TO_TIME[s.tietbatdau] ?? '?'} - ${TIET_END[s.tietketthuc] ?? '?'}`,
        }));

        return NextResponse.json({
            success: true,
            today: todaySessions,
            subjects: subjectResult.data ?? [],
            hockyList: hockyResult.data ?? [],
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
