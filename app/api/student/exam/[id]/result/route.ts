import { NextRequest, NextResponse } from 'next/server';
import { examRepo } from '@/services/repositories/sinhvien/exam.repo';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';
import { verifyToken, extractBearer } from "@/lib/utils/jwt";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractBearer(request.headers.get("authorization"));
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        // Xác thực JWT
        let payload;
        try {
            payload = await verifyToken(token);
        } catch {
            return NextResponse.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
        }

        const { id } = await params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Tìm masv từ mataikhoan
        const { data: sinhvien } = await supabase
            .from('sinhvien')
            .select('masv')
            .eq('mataikhoan', payload.mataikhoan)
            .single();

        if (!sinhvien) {
            return NextResponse.json({ success: false, message: 'Student profile not found' }, { status: 404 });
        }

        const { data, error } = await examRepo.getExamResultDetail(sinhvien.masv, parseInt(id));

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
