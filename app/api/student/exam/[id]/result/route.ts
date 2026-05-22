import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/services/service/sinhvien/exam.service';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
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

        // Tìm masv từ mataikhoan qua sinhVienService
        const sinhvien = await sinhVienService.getBasicInfo(payload.mataikhoan);

        const data = await examService.getExamResultDetail(sinhvien.masv, parseInt(id));
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
