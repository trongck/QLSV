import { NextResponse } from 'next/server';
import { extractBearer, verifyToken } from '@/lib/utils/jwt';
import { createClient } from '@supabase/supabase-js';

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

        // Tạo client thuần, không dùng cookies của request để tránh gửi token hết hạn lên Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
