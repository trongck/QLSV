// app/api/sinhvien/doan/route.ts
// Lấy danh sách đồ án (baitap loại Doan) từ các môn học sinh viên đang học

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) throw new Error('Chưa đăng nhập');

        const payload = await verifyToken(token);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Lấy masv
        const { data: sv, error: svErr } = await supabase
            .from('sinhvien')
            .select('masv')
            .eq('mataikhoan', payload.mataikhoan)
            .single();

        if (svErr || !sv) throw new Error('Không tìm thấy thông tin sinh viên');

        // 2. Lấy các maphancong sinh viên đang học
        const { data: svMH } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', sv.masv);

        const maPhanCongs = (svMH ?? []).map((r) => r.maphancong).filter(Boolean);

        if (maPhanCongs.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        // 3. Lấy baitap loai = 'Doan' trong các phancong đó
        const { data: doan, error: dErr } = await supabase
            .from('baitap')
            .select(`
                mabaitap,
                tieude,
                mota,
                hannop,
                loai,
                ngaytao,
                maphancong,
                phancong:maphancong (
                    monhoc:mamon ( mamon, tenmon ),
                    giangvien:magv ( magv, hoten )
                )
            `)
            .eq('loai', 'Doan')
            .in('maphancong', maPhanCongs)
            .order('ngaytao', { ascending: false });

        if (dErr) throw new Error(dErr.message);

        return NextResponse.json({ success: true, data: doan ?? [] });
    } catch (error: any) {
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}
