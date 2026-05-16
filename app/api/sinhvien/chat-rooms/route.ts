import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: sv, error: svError } = await supabase
            .from('sinhvien')
            .select('masv')
            .eq('mataikhoan', payload.mataikhoan)
            .single();

        if (svError || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
        const CURRENT_USER_ID = sv.masv;

        // 4. LOGIC TRUY VẤN DATABASE THỰC SỰ CHÍNH LÀ ĐOẠN NÀY ĐÂY:
        // BẠN SỬA LẠI ĐOẠN TRUY VẤN NÀY:
        const { data, error } = await supabase
            .from('thanhvientrochuyen')
            .select(`
        macuoctrochuyen, 
        cuoctrochuyen (
          tieude, 
          loai, 
          ngaytao,
          thanhvientrochuyen (
            masv, 
            magv,
            giangvien:magv ( hoten ),
            sinhvien:masv ( hoten )
          ) 
        )
      `)
            .eq('masv', CURRENT_USER_ID);

        // Nếu Supabase báo lỗi thì ném lỗi ra
        if (error) throw new Error(error.message);

        // 5. Trả về data thật lấy từ cơ sở dữ liệu
        return NextResponse.json({ success: true, data: data }, { status: 200 });

    } catch (error: any) {
        console.error("Lỗi API chat-rooms:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}