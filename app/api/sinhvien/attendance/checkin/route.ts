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
        const { method, maphancong: maphancongParam, qrToken, mabuoihoc: mabuoihocParam, note } = body;

        // ── Validate method ────────────────────────────────────────────────────
        if (!method || !['qr', 'khuon_mat', 'thu_cong'].includes(method)) {
            return NextResponse.json(
                { success: false, message: 'Phương thức điểm danh không hợp lệ' },
                { status: 400 }
            );
        }

        let maphancong = maphancongParam;
        let finalMabuoihoc = mabuoihocParam ? parseInt(mabuoihocParam) : null;

        // ── 1. Xử lý điểm danh bằng QR ─────────────────────────────────────────
        if (method === 'qr') {
            if (!qrToken) {
                return NextResponse.json(
                    { success: false, message: 'Thiếu mã QR token' },
                    { status: 400 }
                );
            }

            const isTeacherQr = qrToken.startsWith('mabuoihoc_') || qrToken.startsWith('qlsv-attendance:');

            if (isTeacherQr) {
                let parsedMabuoihoc = NaN;
                let expectedSecret = qrToken;

                if (qrToken.startsWith('qlsv-attendance:')) {
                    const parts = qrToken.split(':');
                    parsedMabuoihoc = parseInt(parts[1]);
                    expectedSecret = parts[2] || '';
                } else {
                    parsedMabuoihoc = parseInt(qrToken.split('_')[1]);
                }

                if (isNaN(parsedMabuoihoc)) {
                    return NextResponse.json({ success: false, message: 'Mã QR không hợp lệ' }, { status: 400 });
                }

                // 1. Kiểm tra sự tồn tại và trạng thái của buổi học
                const { data: buoihoc, error: bhError } = await supabase
                    .from('buoihoc')
                    .select('mabuoihoc, qr_secret, trangthai, lichhoc(maphong, maphancong)')
                    .eq('mabuoihoc', parsedMabuoihoc)
                    .single();

                if (bhError || !buoihoc) {
                    return NextResponse.json({ success: false, message: 'Không tìm thấy thông tin ca điểm danh này.' }, { status: 400 });
                }

                if (buoihoc.trangthai !== 'DangDiemdanh') {
                    return NextResponse.json({ success: false, message: 'Phiên điểm danh này chưa được kích hoạt hoặc đã đóng lại.' }, { status: 400 });
                }

                if (!buoihoc.qr_secret || buoihoc.qr_secret !== expectedSecret) {
                    return NextResponse.json({ success: false, message: 'Mã QR điểm danh không hợp lệ hoặc đã hết hạn.' }, { status: 400 });
                }

                finalMabuoihoc = parsedMabuoihoc;
                maphancong = (buoihoc.lichhoc as any)?.maphancong;
            } else {
                try {
                    const payload = JSON.parse(Buffer.from(qrToken, 'base64url').toString('utf8'));
                    if (!payload.mabuoihoc) {
                        return NextResponse.json({ success: false, message: 'Mã QR không hợp lệ' }, { status: 400 });
                    }
                    if (Date.now() > payload.expires) {
                        return NextResponse.json({ success: false, message: 'Mã QR đã hết hạn' }, { status: 400 });
                    }
                    finalMabuoihoc = payload.mabuoihoc;
                } catch {
                    return NextResponse.json({ success: false, message: 'Mã QR không hợp lệ hoặc sai định dạng' }, { status: 400 });
                }

                // Truy vấn để tìm maphancong từ finalMabuoihoc
                const { data: buoiData } = await supabase
                    .from('buoihoc')
                    .select('mabuoihoc, ngayhoc, lichhoc(maphancong)')
                    .eq('mabuoihoc', finalMabuoihoc)
                    .single();
                if (!buoiData) {
                    return NextResponse.json({ success: false, message: 'Không tìm thấy thông tin buổi học từ QR' }, { status: 400 });
                }
                maphancong = (buoiData as any).lichhoc?.maphancong;
            }
        }

        // ── 2. Xử lý điểm danh khuôn mặt / thủ công (nếu thiếu maphancong) ──────
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const thuTrongTuan = today.getDay() === 0 ? 8 : today.getDay() + 1;

        if (!maphancong) {
            // Tự động tìm môn học đang diễn ra của sinh viên
            const { data: svMonHocs } = await supabase
                .from('sinhvienmonhoc')
                .select('maphancong')
                .eq('masv', sv.masv);
            const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];

            if (maphancongList.length > 0) {
                const { data: lichhocs } = await supabase
                    .from('lichhoc')
                    .select('malichhoc, maphancong, tietbatdau, tietketthuc')
                    .in('maphancong', maphancongList)
                    .eq('thutrongtuan', thuTrongTuan);

                const nowMin = today.getHours() * 60 + today.getMinutes();
                let activeLh = null;
                for (const lh of (lichhocs ?? [])) {
                    const startStr = TIET_TO_TIME[lh.tietbatdau] ?? '07:00';
                    const endStr = TIET_TO_TIME[lh.tietketthuc] ?? '11:10';
                    const [sh, sm] = startStr.split(':').map(Number);
                    const [eh, em] = endStr.split(':').map(Number);
                    const startMin = sh * 60 + sm - 30; // buffer 30p
                    const endMin = eh * 60 + em + 50 + 30; // tiết học 50p + buffer 30p
                    if (nowMin >= startMin && nowMin <= endMin) {
                        activeLh = lh;
                        break;
                    }
                }

                if (activeLh) {
                    maphancong = activeLh.maphancong;
                    // Tìm hoặc tạo buoihoc cho lichhoc này hôm nay
                    const { data: existBuoi } = await supabase
                        .from('buoihoc')
                        .select('mabuoihoc')
                        .eq('malichhoc', activeLh.malichhoc)
                        .eq('ngayhoc', todayStr)
                        .maybeSingle();

                    if (existBuoi) {
                        finalMabuoihoc = existBuoi.mabuoihoc;
                    } else {
                        const { data: newBuoi } = await supabase
                            .from('buoihoc')
                            .insert({ malichhoc: activeLh.malichhoc, ngayhoc: todayStr })
                            .select('mabuoihoc')
                            .single();
                        finalMabuoihoc = newBuoi?.mabuoihoc ?? null;
                    }
                }
            }
        }

        if (!maphancong) {
            return NextResponse.json(
                { success: false, message: 'Không tìm thấy môn học nào đang diễn ra hôm nay để điểm danh' },
                { status: 400 }
            );
        }


        // Kiểm tra SV có đăng ký môn đó không
        const { data: hasRegistration } = await supabase
            .from('sinhvienmonhoc')
            .select('masv')
            .eq('masv', sv.masv)
            .eq('maphancong', maphancong)
            .maybeSingle();


        if (!hasRegistration) {
            return NextResponse.json({ success: false, message: 'Bạn không đăng ký môn học này' }, { status: 400 });
        }

        // ── 3. Xác định trạng thái (Comat / Dimuon) ──────────────────────────
        let trangthai: string = 'Comat';

        if (!finalMabuoihoc) {
            // Tìm lịch học hôm nay của môn này để tạo buổi học
            const { data: lichhocs } = await supabase
                .from('lichhoc')
                .select('malichhoc, tietbatdau, tietketthuc')
                .eq('maphancong', maphancong)
                .eq('thutrongtuan', thuTrongTuan)
                .limit(1);

            const lh = lichhocs?.[0];
            if (lh) {
                const { data: existBuoi } = await supabase
                    .from('buoihoc')
                    .select('mabuoihoc')
                    .eq('malichhoc', lh.malichhoc)
                    .eq('ngayhoc', todayStr)
                    .maybeSingle();

                if (existBuoi) {
                    finalMabuoihoc = existBuoi.mabuoihoc;
                } else {
                    const { data: newBuoi } = await supabase
                        .from('buoihoc')
                        .insert({ malichhoc: lh.malichhoc, ngayhoc: todayStr })
                        .select('mabuoihoc')
                        .single();
                    finalMabuoihoc = newBuoi?.mabuoihoc ?? null;
                }

                // Tính đi muộn (quá 15 phút)
                if (lh.tietbatdau) {
                    const startStr = TIET_TO_TIME[lh.tietbatdau] ?? '07:00';
                    const [sh, sm] = startStr.split(':').map(Number);

                    const startDate = new Date(todayStr);
                    startDate.setUTCHours(sh - 7, sm, 0, 0);
                    const diffMin = (Date.now() - startDate.getTime()) / 60000;

                    if (diffMin > 15) trangthai = 'Dimuon';
                }
            }
        } else {
            // Tính đi muộn dựa trên finalMabuoihoc đã có sẵn
            const { data: buoi } = await supabase
                .from('buoihoc')
                .select('mabuoihoc, ngayhoc, lichhoc:malichhoc ( tietbatdau )')
                .eq('mabuoihoc', finalMabuoihoc)
                .maybeSingle();
            if (buoi && (buoi as any).lichhoc?.tietbatdau) {
                const startStr = TIET_TO_TIME[(buoi as any).lichhoc.tietbatdau] ?? '07:00';
                const [sh, sm] = startStr.split(':').map(Number);
                const startDate = new Date(buoi.ngayhoc);
                startDate.setUTCHours(sh - 7, sm, 0, 0);
                const diffMin = (Date.now() - startDate.getTime()) / 60000;
                if (diffMin > 15) trangthai = 'Dimuon';
            }
        }

        // ── 4. Ghi vào bảng diemdanh nếu có mabuoihoc ───────────────────────────
        if (finalMabuoihoc) {
            const { data: existing } = await supabase
                .from('diemdanh')
                .select('madiemdanh, thoigiandiemdanh, trangthai')
                .eq('masv', sv.masv)
                .eq('mabuoihoc', finalMabuoihoc)
                .maybeSingle();

            if (existing && ['Comat', 'Dimuon', 'Cophep'].includes(existing.trangthai)) {
                const timeStr = existing.thoigiandiemdanh 
                    ? new Date(existing.thoigiandiemdanh).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
                    : '--';
                return NextResponse.json({
                    success: false,
                    alreadyCheckedIn: true,
                    message: `Bạn đã điểm danh buổi học này lúc ${timeStr}`,
                    existing,
                }, { status: 409 });
            }

            const methodMapping: Record<string, string> = {
                qr: 'QR',
                khuon_mat: 'Face',
                thu_cong: 'Manual'
            };
            const dbMethod = methodMapping[method] ?? 'Manual';
            const ghichu = note ?? (method === 'khuon_mat' ? 'Xác thực khuôn mặt' : method === 'qr' ? 'Quét mã QR' : 'Thủ công');
            const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");

            let dd, ddErr;
            if (existing) {
                const { data, error } = await supabase
                    .from('diemdanh')
                    .update({
                        thoigiandiemdanh: vnNow,
                        trangthai,
                        phuongthuc: dbMethod,
                        ghichu,
                    })
                    .eq('madiemdanh', existing.madiemdanh)
                    .select()
                    .single();
                dd = data;
                ddErr = error;
            } else {
                const { data, error } = await supabase
                    .from('diemdanh')
                    .insert({
                        masv: sv.masv,
                        mabuoihoc: finalMabuoihoc,
                        thoigiandiemdanh: vnNow,
                        trangthai,
                        phuongthuc: dbMethod,
                        ghichu,
                        ngaytao: vnNow,
                    })
                    .select()
                    .single();
                dd = data;
                ddErr = error;
            }

            if (ddErr) throw new Error(ddErr.message);

            return NextResponse.json({
                success: true,
                message: trangthai === 'Dimuon' ? 'Điểm danh thành công (đi muộn)' : 'Điểm danh thành công!',
                trangthai,
                data: dd,
            });
        }

        return NextResponse.json({
            success: false,
            message: 'Không tìm thấy hoặc không thể tạo buổi học để ghi nhận điểm danh',
        }, { status: 400 });

    } catch (error: any) {
        const status = error.message.includes('đăng nhập') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
