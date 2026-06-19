// app/api/student/exam/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/services/service/sinhvien/exam.service';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
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

        let payload;
        try {
            payload = await verifyToken(token);
        } catch {
            return NextResponse.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { answers, cheatCount } = body;

        const sinhvien = await sinhVienService.getBasicInfo(payload.mataikhoan);
        const data = await examService.submitExam(sinhvien.masv, parseInt(id), answers, cheatCount);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
