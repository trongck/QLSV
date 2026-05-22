// app/api/sinhvien/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { notificationSVService } from '@/services/service/sinhvien/notification.service';

/**
 * Helper: Lấy mã tài khoản đang đăng nhập từ JWT
 */
async function getCurrentUserAccount(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');

    const payload = await verifyToken(token);
    return payload.mataikhoan;
}

// ─── GET /api/sinhvien/notifications ─────────────────────────────────────────
// Trả về danh sách thông báo + số chưa đọc
export async function GET(request: NextRequest) {
    try {
        const mataikhoan = await getCurrentUserAccount(request);
        const data = await notificationSVService.getAll(mataikhoan);
        const unreadCount = data.filter((tb: any) => !tb.dadoc).length;

        return NextResponse.json({
            success: true,
            data,
            unreadCount,
        });
    } catch (error: any) {
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}

// ─── PATCH /api/sinhvien/notifications ───────────────────────────────────────
// Body: { mathongbao: number }  → đánh dấu đã đọc
// Body: { all: true }           → đánh dấu tất cả đã đọc
export async function PATCH(request: NextRequest) {
    try {
        const mataikhoan = await getCurrentUserAccount(request);
        const body = await request.json();

        if (body.all === true) {
            const result = await notificationSVService.markAllAsRead(mataikhoan);
            return NextResponse.json(result);
        }

        if (!body.mathongbao || typeof body.mathongbao !== 'number') {
            return NextResponse.json(
                { success: false, message: 'mathongbao không hợp lệ' },
                { status: 400 }
            );
        }

        const result = await notificationSVService.markAsRead(body.mathongbao, mataikhoan);
        return NextResponse.json(result);
    } catch (error: any) {
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}
