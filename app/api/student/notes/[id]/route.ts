// app/api/student/notes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';
import { sinhVienService } from '@/services/service/sinhvien/student.service';
import { nhatkyService } from '@/services/service/sinhvien/nhatky.service';

async function getCurrentStudent(request: NextRequest) {
    const token = extractBearer(request.headers.get('authorization'));
    if (!token) throw new Error('Chưa đăng nhập');
    const payload = await verifyToken(token);
    const sv = await sinhVienService.getBasicInfo(payload.mataikhoan);
    return sv;
}

// GET /api/student/notes/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sv = await getCurrentStudent(request);
        const data = await nhatkyService.getById(parseInt(id), sv.masv);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') || error.message.includes('sinh viên') ? 401 : error.message.includes('tìm thấy') ? 404 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

// PUT /api/student/notes/[id] — Auto-save
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sv = await getCurrentStudent(request);
        const body = await request.json();

        const updateDto: Record<string, unknown> = {};
        if (body.tieude !== undefined) updateDto.tieude = body.tieude;
        if (body.noidung !== undefined) updateDto.noidung = body.noidung;
        if (body.tamtrang !== undefined) updateDto.tamtrang = body.tamtrang;
        if (body.maphancong !== undefined) updateDto.maphancong = body.maphancong;
        if (body.magv !== undefined) updateDto.magv = body.magv;

        const data = await nhatkyService.update(parseInt(id), sv.masv, updateDto as any);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') || error.message.includes('sinh viên') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}

// DELETE /api/student/notes/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const sv = await getCurrentStudent(request);
        await nhatkyService.delete(parseInt(id), sv.masv);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        const status = error.message.includes('đăng nhập') || error.message.includes('sinh viên') ? 401 : 500;
        return NextResponse.json({ success: false, message: error.message }, { status });
    }
}
