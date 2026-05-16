import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: Request) {
    try {
        // 1. Lấy cookie (Thêm await để tương thích Next.js 15)
        const cookieStore = await cookies();

        // 2. Khởi tạo Supabase client
        const supabase = createClient(cookieStore);

        // 3. ID Sinh viên đang đăng nhập (Tạm fix cứng để test)
        const CURRENT_USER_ID = "SV22A005";

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
            giangvien
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