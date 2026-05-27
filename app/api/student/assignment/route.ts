// app/api/student/assignment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';

export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) throw new Error('Chưa đăng nhập');

        const payload = await verifyToken(token);

        // Gọi Service lấy danh sách bài tập dựa trên mataikhoan
        const data = await sinhVienService.getAssignmentsByAccount(payload.mataikhoan);

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}
