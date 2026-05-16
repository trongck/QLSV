// app/api/sinhvien/notes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { createClient } from '@/lib/utils/supabase/server';
import { nhatkyService } from '@/services/sinhvien/nhatky.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: sv, error } = await supabase
        .from('sinhvien')
        .select('masv, malop')
        .eq('mataikhoan', payload.mataikhoan)
        .single();
    if (error || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
    return sv;
}

// GET /api/sinhvien/notes — Lấy danh sách nhật ký
export async function GET(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const { searchParams } = new URL(request.url);
        const maphancong = searchParams.get('maphancong');
        const data = await nhatkyService.getAll(
            sv.masv,
            maphancong ? parseInt(maphancong) : undefined
        );
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') || error.message.includes('sinh viên') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

// POST /api/sinhvien/notes — Tạo nhật ký mới
export async function POST(request: NextRequest) {
    try {
        const sv = await getCurrentStudent(request);
        const body = await request.json();
        const data = await nhatkyService.create(sv.masv, {
            tieude: body.tieude ?? null,
            noidung: body.noidung ?? '',
            tamtrang: body.tamtrang ?? null,
            maphancong: body.maphancong ?? null,
            magv: body.magv ?? null,
        });
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') || error.message.includes('sinh viên') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
