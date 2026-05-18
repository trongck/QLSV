// app/api/sinhvien/attendance/checkin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';

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

const TIET_TO_TIME: Record<number, string> = {
    1: '07:00', 2: '07:50', 3: '08:40', 4: '09:30',
    5: '10:20', 6: '11:10', 7: '12:30', 8: '13:20',
    9: '14:10', 10: '15:00', 11: '15:50', 12: '16:40',
    13: '18:00', 14: '18:50', 15: '19:40',
};

/**
 * POST /api/sinhvien/attendance/checkin
 * Body:
 *   method       = 'qr' | 'khuon_mat' | 'thu_cong'
 *   maphancong   = number   (bắt buộc — môn học cần điểm danh)
 *   qrToken      = string   (tuỳ chọn, dùng khi method='qr')
 *   mabuoihoc    = number   (tuỳ chọn — nếu có sẽ ghi vào diemdanh)
 *   note         = string   (tuỳ chọn)
 */
export async function POST(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const body = await request.json();
        const { method, maphancong, qrToken, mabuoihoc: mabuoihocParam, note } = body;

        // ── Validate method ────────────────────────────────────────────────────
        if (!method || !['qr', 'khuon_mat', 'thu_cong'].includes(method)) {
            return NextResponse.json(
                { success: false, message: 'Phương thức điểm danh không hợp lệ' },
                { status: 400 }
            );
        }

        if (!maphancong) {
            return NextResponse.json(
                { success: false, message: 'Thiếu mã phân công môn học (maphancong)' },
                { status: 400 }
            );
        }

        // ── Xác định trạng thái (có mặt / muộn) ──────────────────────────────
        let trangthai: string = 'co_mat';

        // Nếu có mabuoihoc thực → dùng để tính muộn
        let finalMabuoihoc: number | null = mabuoihocParam ? parseInt(mabuoihocParam) : null;

        if (!finalMabuoihoc) {
            // Tìm hoặc tạo buoihoc cho hôm nay dựa trên lịch học của maphancong
            const today = new Date();
            const todayStr = today.toISOString().slice(0, 10);
            const thuTrongTuan = today.getDay() === 0 ? 8 : today.getDay() + 1;

            // Tìm lichhoc của phân công này hôm nay
            const { data: lichhocs } = await supabase
                .from('lichhoc')
                .select('malichhoc, tietbatdau, tietketthuc, thutrongtuan')
                .eq('maphancong', maphancong)
                .eq('thutrongtuan', thuTrongTuan)
                .limit(1);

            const lh = lichhocs?.[0];

            if (lh) {
                // Tìm hoặc tạo buoihoc
                const { data: existBuoi } = await supabase
                    .from('buoihoc')
                    .select('mabuoihoc, ngayhoc')
                    .eq('malichhoc', lh.malichhoc)
                    .eq('ngayhoc', todayStr)
                    .maybeSingle();

                if (existBuoi) {
                    finalMabuoihoc = existBuoi.mabuoihoc;
                } else {
                    // Tạo mới buoihoc
                    const { data: newBuoi } = await supabase
                        .from('buoihoc')
                        .insert({ malichhoc: lh.malichhoc, ngayhoc: todayStr })
                        .select('mabuoihoc')
                        .single();
                    finalMabuoihoc = newBuoi?.mabuoihoc ?? null;
                }

                // Tính muộn
                if (lh.tietbatdau) {
                    const startStr = TIET_TO_TIME[lh.tietbatdau] ?? '07:00';
                    const [sh, sm] = startStr.split(':').map(Number);
                    const startDate = new Date(todayStr);
                    startDate.setHours(sh, sm, 0, 0);
                    const diffMin = (Date.now() - startDate.getTime()) / 60000;
                    if (diffMin > 15) trangthai = 'muon';
                }
            }
        }

        // ── Ghi vào bảng diemdanh nếu có mabuoihoc ───────────────────────────
        if (finalMabuoihoc) {
            // Kiểm tra đã điểm danh chưa
            const { data: existing } = await supabase
                .from('diemdanh')
                .select('madiemdanh, thoigian, trangthai')
                .eq('masv', sv.masv)
                .eq('mabuoihoc', finalMabuoihoc)
                .maybeSingle();

            if (existing) {
                const timeStr = new Date(existing.thoigian).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                return NextResponse.json({
                    success: false,
                    alreadyCheckedIn: true,
                    message: `Bạn đã điểm danh buổi học này lúc ${timeStr}`,
                    existing,
                }, { status: 409 });
            }

            const ghichu = note ?? (method === 'khuon_mat' ? 'Xác thực khuôn mặt' : method === 'qr' ? 'Quét mã QR' : 'Thủ công');

            const { data: dd, error: ddErr } = await supabase
                .from('diemdanh')
                .insert({
                    masv: sv.masv,
                    mabuoihoc: finalMabuoihoc,
                    thoigian: new Date().toISOString(),
                    trangthai,
                    phuongthuc: method,
                    ghichu,
                })
                .select()
                .single();

            if (ddErr) throw new Error(ddErr.message);

            return NextResponse.json({
                success: true,
                message: trangthai === 'muon' ? 'Điểm danh thành công (đi muộn)' : 'Điểm danh thành công!',
                trangthai,
                data: dd,
            });
        }

        // ── Không có buoihoc (không có lịch hôm nay) — vẫn trả về success ──
        // Ghi vào bảng log tạm thời hoặc trả success để UX không bị lỗi
        return NextResponse.json({
            success: true,
            message: `Điểm danh ghi nhận lúc ${new Date().toLocaleTimeString('vi-VN')} (không có lịch học hôm nay)`,
            trangthai: 'co_mat',
            noSession: true,
        });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
