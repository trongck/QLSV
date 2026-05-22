// app/api/sinhvien/notifications/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { notificationSVService } from '@/services/service/sinhvien/notification.service';

// ─── GET /api/sinhvien/notifications/unread ───────────────────────────────────
// Trả về { count: number } — dùng cho badge thông báo trên layout
export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const payload = await verifyToken(token);
        const count = await notificationSVService.getUnreadCount(payload.mataikhoan);
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
