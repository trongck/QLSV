// app/api/sinhvien/notifications/unread/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { notificationSVService } from '@/services/sinhvien/notification.service';

// ─── GET /api/sinhvien/notifications/unread ───────────────────────────────────
// Trả về { count: number } — dùng cho badge thông báo trên layout
export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ success: true, count: 0 });
        }

        const payload = await verifyToken(token);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: sv } = await supabase
            .from('sinhvien')
            .select('masv, malop')
            .eq('mataikhoan', payload.mataikhoan)
            .single();

        if (!sv) return NextResponse.json({ success: true, count: 0 });

        const count = await notificationSVService.getUnreadCount(sv.masv, sv.malop);
        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
