// app/api/sinhvien/attendance/qr/route.ts
// GET  /api/sinhvien/attendance/qr?mabuoihoc=X — tạo QR token cho buổi học
// POST /api/sinhvien/attendance/qr              — validate token (internal)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { diemdanhService } from '@/services/service/sinhvien/diemdanh.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
    return {
        ...sv,
        hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên"
    };
}

/**
 * GET /api/sinhvien/attendance/qr?mabuoihoc=X
 * Tạo mã QR token cho buổi học (hiệu lực 5 phút)
 * Frontend dùng để render QR code hoặc để SV quét
 */
export async function GET(request: NextRequest) {
    try {
        await getCurrentStudent(request); // xác thực đăng nhập
        const { searchParams } = new URL(request.url);
        const mabuoihocStr = searchParams.get('mabuoihoc');

        if (!mabuoihocStr) {
            return NextResponse.json(
                { success: false, message: 'Thiếu tham số mabuoihoc' },
                { status: 400 }
            );
        }

        const mabuoihoc = parseInt(mabuoihocStr);
        if (isNaN(mabuoihoc)) {
            return NextResponse.json(
                { success: false, message: 'mabuoihoc phải là số' },
                { status: 400 }
            );
        }

        // Kiểm tra buổi học tồn tại qua service
        const buoi = await diemdanhService.getBuoiHoc(mabuoihoc);

        if (!buoi) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy buổi học' },
                { status: 404 }
            );
        }

        const qrToken = diemdanhService.generateQRToken(mabuoihoc);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        return NextResponse.json({
            success: true,
            qrToken,
            expiresAt,
            mabuoihoc,
            ngayhoc: buoi.ngayhoc,
            // URL để SV quét (deeplink vào trang điểm danh với token)
            qrUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/student/attendance?token=${qrToken}`,
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

/**
 * POST /api/sinhvien/attendance/qr
 * Body: { token: string }
 * Validate QR token (dùng nội bộ khi frontend decode QR)
 */
export async function POST(request: NextRequest) {
    try {
        await getCurrentStudent(request);
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json({ success: false, message: 'Thiếu token' }, { status: 400 });
        }

        const result = diemdanhService.validateQRToken(token);
        if (!result.valid) {
            return NextResponse.json({ success: false, message: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, mabuoihoc: result.mabuoihoc });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
