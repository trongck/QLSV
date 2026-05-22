// app/api/sinhvien/attendance/leave/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    try {
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
    } catch (e: any) {
        throw new Error('Chưa đăng nhập hoặc phiên làm việc đã hết hạn');
    }
}

/**
 * GET /api/sinhvien/attendance/leave
 * Trả về:
 *  - subjects: danh sách môn học kèm lịch học (lichhoc) của SV trong học kỳ hiện tại
 *  - requests: danh sách đơn xin nghỉ đã nộp
 */
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Lấy danh sách đơn xin nghỉ phép đã gửi
        const { data: requests, error: errReq } = await supabase
            .from('donxinnghi')
            .select(`
                madon, masv, mabuoihoc, lydo, minhchung, trangthai, magvduyet, ghichugv, ngaytao, ngaycapnhat,
                buoihoc (
                    mabuoihoc, ngayhoc,
                    lichhoc (
                        malichhoc, tietbatdau, tietketthuc, maphong, thutrongtuan,
                        phancong (
                            maphancong,
                            monhoc:mamon ( mamon, tenmon ),
                            giangvien:magv ( magv, hodem, ten )
                        )
                    )
                )
            `)
            .eq('masv', sv.masv)
            .order('ngaytao', { ascending: false });

        if (errReq) {
            console.error('[leave/GET] requests error:', errReq.message);
        }

        // 2. Lấy danh sách môn học kèm lịch học trong học kỳ đang hiệu lực
        const { data: svMonHocs } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', sv.masv);
        
        const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];
        
        let subjects: any[] = [];
        if (maphancongList.length > 0) {
            const { data: phanCongs } = await supabase
                .from('phancong')
                .select(`
                    maphancong,
                    monhoc:mamon ( mamon, tenmon, sotinchi ),
                    hocky:mahocky ( mahocky, tenhocky, danghieuluc ),
                    lichhoc ( malichhoc, thutrongtuan, tietbatdau, tietketthuc, maphong )
                `)
                .in('maphancong', maphancongList);
            
            subjects = (phanCongs ?? [])
                .filter((pc: any) => pc.hocky?.danghieuluc)
                .map((pc: any) => ({
                    maphancong: pc.maphancong,
                    tenmon: pc.monhoc?.tenmon ?? '',
                    mamon: pc.monhoc?.mamon ?? '',
                    schedules: pc.lichhoc ?? [],
                }));
        }

        return NextResponse.json({
            success: true,
            subjects,
            requests: requests ?? []
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

/**
 * POST /api/sinhvien/attendance/leave
 * Đăng ký đơn xin nghỉ phép mới
 */
export async function POST(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const body = await request.json();
        const { malichhoc, ngayhoc, lydo, minhchung } = body;

        if (!malichhoc || !ngayhoc || !lydo) {
            return NextResponse.json({ success: false, message: 'Thiếu các thông tin bắt buộc' }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Kiểm tra lịch học có hợp lệ và SV có đăng ký môn đó không
        const { data: svMonHocs } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', sv.masv);
        const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];

        const { data: lh, error: errLh } = await supabase
            .from('lichhoc')
            .select('malichhoc, thutrongtuan, maphancong')
            .eq('malichhoc', malichhoc)
            .single();

        if (errLh || !lh) {
            return NextResponse.json({ success: false, message: 'Lịch học không tồn tại' }, { status: 400 });
        }

        if (!maphancongList.includes(lh.maphancong)) {
            return NextResponse.json({ success: false, message: 'Bạn không đăng ký môn học này' }, { status: 400 });
        }

        // 2. Validate ngày học có trùng thứ học trong tuần
        const parts = ngayhoc.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        const dow = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const thutrongtuan = dow === 0 ? 8 : dow + 1; // 2=T2, ..., 8=CN
        if (lh.thutrongtuan !== thutrongtuan) {
            return NextResponse.json({ success: false, message: 'Ngày xin nghỉ không đúng với thứ học của môn học này' }, { status: 400 });
        }

        // 3. Tìm hoặc tạo buoihoc cho ngày học
        let { data: buoi } = await supabase
            .from('buoihoc')
            .select('mabuoihoc')
            .eq('malichhoc', malichhoc)
            .eq('ngayhoc', ngayhoc)
            .maybeSingle();

        let mabuoihoc: number;
        if (buoi) {
            mabuoihoc = buoi.mabuoihoc;
        } else {
            const { data: newBuoi, error: errBuoi } = await supabase
                .from('buoihoc')
                .insert([{ malichhoc, ngayhoc }])
                .select('mabuoihoc')
                .single();
            if (errBuoi || !newBuoi) {
                return NextResponse.json({ success: false, message: 'Không thể tạo buổi học mới: ' + errBuoi?.message }, { status: 500 });
            }
            mabuoihoc = newBuoi.mabuoihoc;
        }

        // 4. Kiểm tra trùng lặp đơn xin nghỉ
        const { data: existDon } = await supabase
            .from('donxinnghi')
            .select('madon')
            .eq('masv', sv.masv)
            .eq('mabuoihoc', mabuoihoc)
            .maybeSingle();
        if (existDon) {
            return NextResponse.json({ success: false, message: 'Bạn đã nộp đơn xin nghỉ cho buổi học này rồi' }, { status: 400 });
        }

        // 5. Tạo đơn xin nghỉ mới
        const { data: newDon, error: errDon } = await supabase
            .from('donxinnghi')
            .insert([{
                masv: sv.masv,
                mabuoihoc,
                lydo,
                minhchung: minhchung ?? null,
                trangthai: 'ChoDuyet'
            }])
            .select()
            .single();

        if (errDon || !newDon) {
            return NextResponse.json({ success: false, message: 'Lưu đơn xin nghỉ thất bại: ' + errDon?.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: newDon });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
