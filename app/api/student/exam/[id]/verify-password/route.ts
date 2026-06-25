import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/utils/supabase/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
            await verifyToken(token);
        } catch {
            return NextResponse.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { matkhau } = body;

        if (typeof matkhau !== 'string') {
            return NextResponse.json({ success: false, message: 'Mật khẩu không hợp lệ' }, { status: 400 });
        }

        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
            .from('dethi')
            .select('matkhau')
            .eq('madethi', parseInt(id))
            .single();

        if (error || !data) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy đề thi' }, { status: 404 });
        }

        if (data.matkhau === matkhau) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Mật khẩu không chính xác' });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
