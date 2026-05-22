import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';
import { extractBearer, verifyToken } from '@/lib/utils/jwt';

export async function GET(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        await verifyToken(token);

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const payload = await verifyToken(token);
        const CURRENT_USER_ID = payload.mataikhoan;

        const supabase = createClient(await cookies());
        const { data, error } = await supabase
            .from('tinnhan')
            .select('*')
            .eq('macuoctrochuyen', Number(roomId))
            .order('ngaytao', { ascending: true });

        if (error) throw new Error(error.message);

        // Lọc bỏ những tin nhắn đã bị user này xóa
        const filteredData = (data || []).filter((msg: any) => {
            const deletedBy = msg.nguoidaxoa || [];
            return !deletedBy.includes(CURRENT_USER_ID);
        });

        return NextResponse.json({ success: true, data: filteredData }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        await verifyToken(token);

        const body = await request.json();

        if (!body.macuoctrochuyen || !body.mataikhoangui || (!body.noidung?.trim() && !body.filedinh)) {
            return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' }, { status: 400 });
        }

        // Format YYYY-MM-DD HH:mm:ss cho múi giờ Việt Nam
        const vnDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
        const vnNow = vnDate.toISOString().replace("T", " ").substring(0, 19);

        const supabase = createClient(await cookies());
        const { data, error } = await supabase
            .from('tinnhan')
            .insert([{
                macuoctrochuyen: body.macuoctrochuyen,
                mataikhoangui: body.mataikhoangui,
                noidung: body.noidung || '',
                filedinh: body.filedinh || null,
                dachinh: false,
                ngaytao: vnNow,
                ngaycapnhat: vnNow
            }])
            .select();

        if (error) {
            console.error("Supabase insert error:", error);
            throw new Error(error.message);
        }

        // Removed cuoctrochuyen ngaycapnhat update because column does not exist

        return NextResponse.json({ success: true, data: data[0] }, { status: 201 });
    } catch (error: any) {
        console.error("SendMessage API Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}