// app/api/student/hocky/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { scheduleService } from '@/services/service/sinhvien/schedule.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
    return sv;
}

/**
 * GET /api/student/hocky
 * Trả danh sách học kỳ
 */
export async function GET(request: NextRequest) {
    try {
        await getCurrentStudent(request);
        const data = await scheduleService.getHocKyList();

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
