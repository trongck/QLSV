// app/api/sinhvien/messages/route.ts
import { NextResponse } from 'next/server';
import { messageService } from '@/services/service/sinhvien/message.service';

import { verifyToken, extractBearer } from '@/lib/utils/jwt';

// Xử lý request lấy tin nhắn
export async function GET(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const rawData = await messageService.getRoomMessages(Number(roomId));
        
        // Lọc các tin nhắn mà user hiện tại chưa xóa
        const data = (rawData ?? []).filter((msg: any) => !(msg.nguoidaxoa || []).includes(payload.mataikhoan));

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// Xử lý request gửi tin nhắn mới
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = await messageService.sendMessage(body.macuoctrochuyen, body.mataikhoangui, body.noidung);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}