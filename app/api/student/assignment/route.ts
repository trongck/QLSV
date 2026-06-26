// app/api/student/assignment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { VaiTro } from '@/types';

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

export async function POST(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
        }

        const payload = await verifyToken(token) as any;
        if (payload.vaitro !== VaiTro.SinhVien) {
            return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 403 });
        }

        // Lấy thông tin cơ bản sinh viên để có masv
        const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);

        const body = await request.json();
        const { mabaitap, noidungnop, filenop } = body;

        if (!mabaitap) {
            return NextResponse.json({ success: false, message: 'Thiếu mã bài tập' }, { status: 400 });
        }

        const result = await sinhVienService.submitAssignment(
            sv.masv,
            Number(mabaitap),
            noidungnop ?? null,
            filenop ?? null
        );

        return NextResponse.json({
            success: true,
            updated: result.updated,
            message: result.updated ? 'Cập nhật bài nộp thành công' : 'Nộp bài thành công',
            data: result
        });
    } catch (error: any) {
        console.error('Lỗi POST /api/student/assignment:', error.message);
        const isAuth = error.message.includes('đăng nhập') || error.message.includes('sinh viên');
        return NextResponse.json(
            { success: false, message: error.message },
            { status: isAuth ? 401 : 500 }
        );
    }
}

