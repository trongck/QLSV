// app/api/sinhvien/messages/route.ts
import { NextResponse } from 'next/server';
import { messageService } from '@/services/sinhvien/message.service';

// Xử lý request lấy tin nhắn
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const data = await messageService.getRoomMessages(Number(roomId));
        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// Xử lý request gửi tin nhắn mới
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data = await messageService.sendMessage(body.macuoctrochuyen, body.masvgui, body.noidung);
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}