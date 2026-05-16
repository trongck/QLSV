// app/api/sinhvien/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { scheduleRepo, tietToTimeRange } from '@/services/repositories/sinhvien/schedule.repo';

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
 * GET /api/sinhvien/schedule
 * 
 * Query params:
 *   mode      = 'week' | 'semester'  (default: 'week')
 *   mahocky   = number               (optional, default: học kỳ hiệu lực)
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const { searchParams } = new URL(request.url);
        const mode = (searchParams.get('mode') ?? 'week') as 'week' | 'semester';
        const mahockyParam = searchParams.get('mahocky');
        const mahocky = mahockyParam ? parseInt(mahockyParam) : undefined;

        if (mode === 'semester') {
            // ── Chế độ Học Kỳ ──────────────────────────────────────────────
            let targetMahocky = mahocky;
            if (!targetMahocky) {
                const { data: hk } = await scheduleRepo.getCurrentHocKy();
                targetMahocky = hk?.mahocky;
            }
            if (!targetMahocky) {
                return NextResponse.json({ success: false, message: 'Không tìm thấy học kỳ hiệu lực' }, { status: 404 });
            }

            const { data, error } = await scheduleRepo.getSemesterSchedule(sv.masv, targetMahocky);
            if (error) throw new Error(error.message);

            // Enrich với timeRange
            const enriched = (data ?? []).map((pc: any) => ({
                ...pc,
                lichhoc: (pc.lichhoc ?? []).map((lh: any) => ({
                    ...lh,
                    timeRange: tietToTimeRange(lh.tietbatdau, lh.tietketthuc),
                    thuLabel: thuLabel(lh.thutrongtuan),
                })).sort((a: any, b: any) => a.thutrongtuan - b.thutrongtuan || a.tietbatdau - b.tietbatdau),
            }));

            return NextResponse.json({
                success: true,
                mode: 'semester',
                mahocky: targetMahocky,
                data: enriched,
            });

        } else {
            // ── Chế độ Tuần ────────────────────────────────────────────────
            const { data, error } = await scheduleRepo.getWeekSchedule(sv.masv, mahocky);
            if (error) throw new Error(error.message);

            // Enrich với timeRange
            const enriched = (data ?? []).map((lh: any) => ({
                ...lh,
                timeRange: tietToTimeRange(lh.tietbatdau, lh.tietketthuc),
                thuLabel: thuLabel(lh.thutrongtuan),
            }));

            return NextResponse.json({
                success: true,
                mode: 'week',
                data: enriched,
            });
        }
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

function thuLabel(thu: number): string {
    const map: Record<number, string> = {
        2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4',
        5: 'Thứ 5', 6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật',
    };
    return map[thu] ?? `Thứ ${thu}`;
}
