import { NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@/lib/utils/jwt';
import { messageService } from '@/services/service/sinhvien/message.service';

export async function GET(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        const CURRENT_USER_ID = payload.mataikhoan;

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const result = await messageService.getMessages(Number(roomId), CURRENT_USER_ID, 1, 999999);

        return NextResponse.json({ success: true, data: result.data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const payload = await verifyToken(token);
        const CURRENT_USER_ID = payload.mataikhoan;

        const body = await request.json();

        if (!body.macuoctrochuyen || !body.mataikhoangui || (!body.noidung?.trim() && !body.filedinh)) {
            return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' }, { status: 400 });
        }

        const msg = await messageService.sendMessage(
            Number(body.macuoctrochuyen),
            CURRENT_USER_ID,
            body.noidung,
            body.filedinh
        );

        return NextResponse.json({ success: true, data: msg }, { status: 201 });
    } catch (error: any) {
        console.error("SendMessage API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}