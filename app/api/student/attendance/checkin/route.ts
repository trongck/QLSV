// app/api/student/attendance/checkin/route.ts
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
 * POST /api/student/attendance/checkin
 * Body:
 *   method       = 'qr' | 'khuon_mat' | 'thu_cong'
 *   maphancong   = number   (bắt buộc — môn học cần điểm danh)
 *   qrToken      = string   (tuỳ chọn, dùng khi method='qr')
 *   mabuoihoc    = number   (tuỳ chọn — nếu có sẽ ghi vào diemdanh)
 *   note         = string   (tuỳ chọn)
 */
export async function POST(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const body = await request.json();
        const result = await diemdanhService.processCheckIn(sv.masv, body);

        if (result.alreadyCheckedIn) {
            const timeStr = result.existing.thoigiandiemdanh 
                ? new Date(result.existing.thoigiandiemdanh).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                : '--';
            return NextResponse.json({
                success: false,
                alreadyCheckedIn: true,
                message: `Bạn đã điểm danh buổi học này lúc ${timeStr}`,
                existing: result.existing,
            }, { status: 409 });
        }

        return NextResponse.json({
            success: true,
            message: result.trangthai === 'Dimuon' ? 'Điểm danh thành công (đi muộn)' : 'Điểm danh thành công!',
            trangthai: result.trangthai,
            data: result.data,
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
