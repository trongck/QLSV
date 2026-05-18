// app/api/sinhvien/attendance/route.ts
// GET /api/sinhvien/attendance — lịch sử điểm danh
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { diemdanhRepo } from '@/services/repositories/sinhvien/diemdanh.repo';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: sv, error } = await supabase
        .from('sinhvien')
        .select('masv, malop, hodem, ten')
        .eq('mataikhoan', payload.mataikhoan)
        .single();
    if (error || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
    return {
        ...sv,
        hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh Viên"
    };
}

/**
 * GET /api/sinhvien/attendance
 * Query params:
 *   mode        = 'history' | 'stats'   (default: 'history')
 *   mahocky     = number                (optional)
 *   maphancong  = number                (optional)
 *   month       = number                (1-12, optional)
 *   year        = number                (optional)
 *   limit       = number                (optional, default 50)
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const { searchParams } = new URL(request.url);

        const mode = (searchParams.get('mode') ?? 'history') as 'history' | 'stats';
        const mahocky = searchParams.get('mahocky') ? parseInt(searchParams.get('mahocky')!) : undefined;
        const maphancong = searchParams.get('maphancong') ? parseInt(searchParams.get('maphancong')!) : undefined;
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

        if (mode === 'stats') {
            try {
                const { data, error } = await diemdanhRepo.getStatsBySubject(sv.masv, mahocky);
                if (error) {
                    // Bảng chưa tồn tại hoặc lỗi khác → trả về rỗng thay vì 500
                    console.warn('[attendance/stats]', error.message);
                    return NextResponse.json({ success: true, mode: 'stats', data: [] });
                }
                return NextResponse.json({ success: true, mode: 'stats', data });
            } catch (e: any) {
                console.warn('[attendance/stats] caught:', e.message);
                return NextResponse.json({ success: true, mode: 'stats', data: [] });
            }
        }

        // mode === 'history'
        let data: any[] = [], error: any = null;
        try {
            const result = await diemdanhRepo.getHistory(sv.masv, {
                mahocky, maphancong, month, year, limit,
            });
            data = result.data ?? [];
            error = result.error;
        } catch (e: any) {
            console.warn('[attendance/history] caught:', e.message);
            data = [];
        }
        if (error) {
            console.warn('[attendance/history] error:', error.message);
            data = [];
        }

        // Enrich dữ liệu cho frontend
        const enriched = (data ?? []).map((dd: any) => {
            const lh = dd.buoihoc?.lichhoc;
            const pc = lh?.phancong;
            const ngay = new Date(dd.thoigiandiemdanh ?? dd.thoigian);
            return {
                madiemdanh: dd.madiemdanh,
                thoigian: dd.thoigiandiemdanh ?? dd.thoigian,
                trangthai: dd.trangthai,
                phuongthuc: dd.phuongthuc,
                ghichu: dd.ghichu,
                ngayhoc: dd.buoihoc?.ngayhoc ?? null,
                day: String(ngay.getDate()).padStart(2, '0'),
                month: `T${String(ngay.getMonth() + 1).padStart(2, '0')}`,
                timeStr: ngay.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                monhoc: pc?.monhoc ?? null,
                phong: lh?.maphong ?? null,
                giangvien: pc?.giangvien ? {
                    ...pc.giangvien,
                    hoten: [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Chưa rõ"
                } : null,
                hocky: pc?.hocky ?? null,
                maphancong: lh?.maphancong ?? null,
            };
        });

        return NextResponse.json({ success: true, mode: 'history', data: enriched });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
