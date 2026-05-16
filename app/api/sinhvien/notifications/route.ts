// app/api/sinhvien/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { notificationSVService } from '@/services/service/sinhvien/notification.service';
import { createClient } from '@/lib/utils/supabase/server';

/**
 * Helper: Lấy thông tin sinh viên đang đăng nhập từ JWT
 */
async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');

    const payload = await verifyToken(token);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Lấy masv và malop từ bảng sinhvien
    const { data: sv, error } = await supabase
        .from('sinhvien')
        .select('masv, malop')
        .eq('mataikhoan', payload.mataikhoan)
        .single();

    if (error || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
    return sv as { masv: string; malop: string };
}

// ─── GET /api/sinhvien/notifications ─────────────────────────────────────────
// Trả về danh sách thông báo + số chưa đọc
export async function GET(request: NextRequest) {
    try {
        const { masv, malop } = await getCurrentStudent(request);
        const data = await notificationSVService.getAll(masv, malop);
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
        const { masv, malop } = await getCurrentStudent(request);
        const body = await request.json();

        if (body.all === true) {
            const result = await notificationSVService.markAllAsRead(masv, malop);
            return NextResponse.json(result);
        }

        if (!body.mathongbao || typeof body.mathongbao !== 'number') {
            return NextResponse.json(
                { success: false, message: 'mathongbao không hợp lệ' },
                { status: 400 }
            );
        }

        const result = await notificationSVService.markAsRead(body.mathongbao, masv);
        return NextResponse.json(result);
    } catch (error: any) {
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}
