// app/api/student/exam/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { examService } from '@/services/service/sinhvien/exam.service';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';

async function getSinhVien(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Unauthorized');
    const payload = await verifyToken(token);
    const sinhvien = await sinhVienService.getBasicInfo(payload.mataikhoan);
    return { sinhvien, payload };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        try {
            await verifyToken(token);
        } catch {
            return NextResponse.json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
        }

        const { id } = await params;
        const madethi = parseInt(id);
        if (isNaN(madethi)) {
            return NextResponse.json({ success: false, error: 'ID đề thi không hợp lệ' }, { status: 400 });
        }
        const data = await examService.getExamDetail(madethi);
        if (data && data.matkhau) {
            data.matkhau = "true" as any; // Obfuscate password but keep it truthy for client logic
        }
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { sinhvien } = await getSinhVien(request);
        const { id } = await params;
        const madethi = parseInt(id);
        if (isNaN(madethi)) {
            return NextResponse.json({ success: false, error: 'ID đề thi không hợp lệ' }, { status: 400 });
        }

        const body = await request.json();
        const action = body.action as string;

        if (action === 'START') {
            // Bắt đầu làm bài: validate + insert DangLam + trả về effectiveTimeSec
            const result = await examService.startExam(sinhvien.masv, madethi);
            return NextResponse.json({ success: true, data: result });
        }

        if (action === 'CHEAT') {
            // Đánh dấu vi phạm khi SV rời tab
            await examService.markCheat(sinhvien.masv, madethi);
            return NextResponse.json({ success: true, message: 'Đã ghi nhận vi phạm' });
        }

        return NextResponse.json({ success: false, error: 'Action không hợp lệ' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.message?.includes('Unauthorized') ? 401 : 400 });
    }
}

