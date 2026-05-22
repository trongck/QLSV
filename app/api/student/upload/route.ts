import { NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';

export async function POST(request: Request) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        await verifyToken(token);

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Không có file được chọn' }, { status: 400 });
        }

        const data = await sinhVienService.uploadFile(file);

        return NextResponse.json({
            success: true,
            ...data
        }, { status: 200 });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
