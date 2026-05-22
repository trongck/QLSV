// app/api/student/attendance/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { diemdanhService } from '@/services/service/sinhvien/diemdanh.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    try {
        const payload = await verifyToken(token) as any;
        const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
        return {
            ...sv,
            hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh Viên"
        };
    } catch (e: any) {
        throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }
}

/**
 * GET /api/student/attendance/leave
 * Trả về:
 *  - subjects: danh sách môn học kèm lịch học (lichhoc) của SV trong học kỳ hiện tại
 *  - requests: danh sách đơn xin nghỉ đã nộp
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const [subjects, requests] = await Promise.all([
            diemdanhService.getActiveSubjects(sv.masv),
            diemdanhService.getLeaveRequests(sv.masv)
        ]);

        return NextResponse.json({
            success: true,
            subjects,
            requests
        });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

/**
 * POST /api/student/attendance/leave
 * Đăng ký đơn xin nghỉ phép mới
 */
export async function POST(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const body = await request.json();
        const result = await diemdanhService.submitLeaveRequest(sv.masv, body);
        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
