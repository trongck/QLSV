// app/api/sinhvien/hocky/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { scheduleRepo } from '@/services/repositories/sinhvien/schedule.repo';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: sv, error } = await supabase
        .from('sinhvien')
        .select('masv, malop')
        .eq('mataikhoan', payload.mataikhoan)
        .single();
    if (error || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
    return sv;
}

/**
 * GET /api/sinhvien/hocky
 * Trả danh sách học kỳ mà sinh viên có phân công (có môn học)
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const { data, error } = await scheduleRepo.getHocKyList(sv.masv);
        if (error) throw new Error(error.message);

        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
