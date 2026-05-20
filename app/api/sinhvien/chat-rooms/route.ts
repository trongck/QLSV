import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/utils/supabase/server';
import { verifyToken, extractBearer } from '@/lib/utils/jwt';

export async function GET(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 4. LOGIC TRUY VẤN DATABASE:
        const { data, error } = await supabase
            .from('thanhvientrochuyen')
            .select(`
                macuoctrochuyen, 
                cuoctrochuyen (
                    tieude, 
                    loai, 
                    ngaytao,
                    nguoidaxoa,
                    thanhvientrochuyen (
                        mataikhoan,
                        vaitro,
                        taikhoan:mataikhoan (
                            mataikhoan,
                            email,
                            vaitro,
                            sinhvien (masv, hodem, ten, anhdaidien),
                            giangvien (magv, hodem, ten, anhdaidien)
                        )
                    ) 
                )
            `)
            .eq('mataikhoan', payload.mataikhoan);

        // Nếu Supabase báo lỗi thì ném lỗi ra
        if (error) throw new Error(error.message);

        // Lọc bỏ cuộc hội thoại mà user hiện tại đã xóa
        const filteredData = (data ?? []).filter((item: any) => {
            const cc = item.cuoctrochuyen;
            if (!cc) return false;
            const deletedUsers = cc.nguoidaxoa || [];
            return !deletedUsers.includes(payload.mataikhoan);
        });

        const mappedData = filteredData.map((item: any) => {
            const cc = item.cuoctrochuyen;
            if (cc && Array.isArray(cc.thanhvientrochuyen)) {
                cc.thanhvientrochuyen = cc.thanhvientrochuyen.map((tv: any) => {
                    const role = tv.taikhoan?.vaitro;
                    let displayName = tv.mataikhoan;
                    let avatar = null;

                    if (role === "SinhVien" && tv.taikhoan?.sinhvien?.[0]) {
                        const sv = tv.taikhoan.sinhvien[0];
                        displayName = `${sv.hodem || ""} ${sv.ten || ""}`.trim() || "Sinh viên";
                        avatar = sv.anhdaidien;
                    } else if (role === "GiangVien" && tv.taikhoan?.giangvien?.[0]) {
                        const gv = tv.taikhoan.giangvien[0];
                        displayName = `${gv.hodem || ""} ${gv.ten || ""}`.trim() || "Giảng viên";
                        avatar = gv.anhdaidien;
                    }

                    return {
                        mataikhoan: tv.mataikhoan,
                        vaitro: tv.vaitro,
                        taikhoan: {
                            email: tv.taikhoan?.email,
                            vaitro: tv.taikhoan?.vaitro,
                            hoten: displayName,
                            anhdaidien: avatar
                        }
                    };
                });
            }
            return {
                ...item,
                cuoctrochuyen: cc
            };
        });

        // 5. Trả về data thật lấy từ cơ sở dữ liệu
        return NextResponse.json({ success: true, data: mappedData }, { status: 200 });

    } catch (error: any) {
        console.error("Lỗi API chat-rooms:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE: Xóa (ẩn) cuộc trò chuyện phía sinh viên
export async function DELETE(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const convId = Number(roomId);
        const userId = payload.mataikhoan;

        // 1. Lấy toàn bộ tin nhắn để đánh dấu đã xóa cho user hiện tại (ẩn phía user)
        const { data: msgs } = await supabase
            .from("tinnhan")
            .select("matinnhan, nguoidaxoa")
            .eq("macuoctrochuyen", convId);

        if (msgs && msgs.length > 0) {
            const updates = msgs.map((m) => {
                const arr = m.nguoidaxoa || [];
                if (!arr.includes(userId)) {
                    return supabase
                        .from("tinnhan")
                        .update({ nguoidaxoa: [...arr, userId] })
                        .eq("matinnhan", m.matinnhan);
                }
                return Promise.resolve();
            });
            await Promise.all(updates);
        }

        // 2. Thêm user vào danh sách nguoidaxoa của cuộc hội thoại
        const { data: conv } = await supabase
            .from("cuoctrochuyen")
            .select("nguoidaxoa")
            .eq("macuoctrochuyen", convId)
            .single();

        if (conv) {
            const arr = conv.nguoidaxoa || [];
            if (!arr.includes(userId)) {
                await supabase
                    .from("cuoctrochuyen")
                    .update({ nguoidaxoa: [...arr, userId] })
                    .eq("macuoctrochuyen", convId);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi API xóa chat-room:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}