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

        const CURRENT_USER_ID = payload.mataikhoan;

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
                        taikhoan:mataikhoan (
                            email,
                            vaitro,
                            sinhvien (hodem, ten, emailtruong, anhdaidien),
                            giangvien (hodem, ten, emailtruong, anhdaidien)
                        )
                    ),
                    tinnhan (
                        matinnhan,
                        noidung,
                        ngaytao,
                        mataikhoangui,
                        nguoidaxoa
                    )
                )
            `)
            .eq('mataikhoan', CURRENT_USER_ID);

        if (error) throw new Error(error.message);

        const mappedData = (data ?? [])
        .filter((item: any) => {
            const cc = item.cuoctrochuyen;
            if (!cc) return false;
            const deletedBy = cc.nguoidaxoa || [];
            if (deletedBy.includes(CURRENT_USER_ID)) return false;
            return true;
        })
        .map((item: any) => {
            const cc = item.cuoctrochuyen;
            if (cc && Array.isArray(cc.thanhvientrochuyen)) {
                cc.thanhvientrochuyen = cc.thanhvientrochuyen.map((tv: any) => {
                    // Extract info from taikhoan relationship
                    const tk = tv.taikhoan;
                    if (tk) {
                        const gv = Array.isArray(tk.giangvien) ? tk.giangvien[0] : tk.giangvien;
                        if (gv) {
                            tv.giangvien = {
                                ...gv,
                                hoten: [gv.hodem, gv.ten].filter(Boolean).join(" ") || "Giảng viên",
                                emailtruong: gv.emailtruong || tk.email
                            };
                        }
                        const sv = Array.isArray(tk.sinhvien) ? tk.sinhvien[0] : tk.sinhvien;
                        if (sv) {
                            tv.sinhvien = {
                                ...sv,
                                hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Sinh viên",
                                emailtruong: sv.emailtruong || tk.email
                            };
                        }
                    }
                    return tv;
                });
            }
            
            // Lấy tin nhắn cuối cùng (nếu có)
            let lastMsg = null;
            if (cc && Array.isArray(cc.tinnhan) && cc.tinnhan.length > 0) {
                // Lọc ra các tin nhắn chưa bị user này xóa
                const validMessages = cc.tinnhan.filter((m: any) => !(m.nguoidaxoa || []).includes(CURRENT_USER_ID));
                if (validMessages.length > 0) {
                    // Sắp xếp giảm dần theo ngày tạo
                    const sortedMessages = [...validMessages].sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime());
                    lastMsg = sortedMessages[0];
                }
            }
            
            return {
                ...item,
                cuoctrochuyen: {
                    ...cc,
                    lastMsg
                }
            };
        });

        // Sắp xếp phòng chat theo thời gian tin nhắn mới nhất
        mappedData.sort((a: any, b: any) => {
            const timeA = a.cuoctrochuyen.lastMsg ? new Date(a.cuoctrochuyen.lastMsg.ngaytao).getTime() : new Date(a.cuoctrochuyen.ngaytao).getTime();
            const timeB = b.cuoctrochuyen.lastMsg ? new Date(b.cuoctrochuyen.lastMsg.ngaytao).getTime() : new Date(b.cuoctrochuyen.ngaytao).getTime();
            return timeB - timeA;
        });

        // 5. Trả về data thật lấy từ cơ sở dữ liệu
        return NextResponse.json({ success: true, data: mappedData }, { status: 200 });

    } catch (error: any) {
        console.error("Lỗi API chat-rooms:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const token = extractBearer(request.headers.get('authorization'));
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        const payload = await verifyToken(token);
        const CURRENT_USER_ID = payload.mataikhoan;

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get('roomId');
        if (!roomId) return NextResponse.json({ success: false, message: 'Thiếu roomId' }, { status: 400 });

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        const { data: conv, error: fetchErr } = await supabase
            .from('cuoctrochuyen')
            .select('macuoctrochuyen, nguoidaxoa')
            .eq('macuoctrochuyen', Number(roomId))
            .single();

        if (fetchErr) throw new Error(fetchErr.message);

        const currentArr = conv.nguoidaxoa || [];
        if (!currentArr.includes(CURRENT_USER_ID)) {
            currentArr.push(CURRENT_USER_ID);
            
            const { error: updateErr } = await supabase
                .from('cuoctrochuyen')
                .update({ nguoidaxoa: currentArr })
                .eq('macuoctrochuyen', Number(roomId));
                
            if (updateErr) throw new Error(updateErr.message);
        }

        // Cập nhật cột nguoidaxoa của TẤT CẢ tin nhắn trong phòng chat này
        const { data: messages, error: msgFetchErr } = await supabase
            .from('tinnhan')
            .select('matinnhan, nguoidaxoa')
            .eq('macuoctrochuyen', Number(roomId));
            
        if (msgFetchErr) throw new Error(msgFetchErr.message);

        const msgsToUpdate = (messages || []).filter((m: any) => !(m.nguoidaxoa || []).includes(CURRENT_USER_ID));
        
        if (msgsToUpdate.length > 0) {
            await Promise.all(msgsToUpdate.map((m: any) => {
                const newArr = [...(m.nguoidaxoa || []), CURRENT_USER_ID];
                return supabase.from('tinnhan').update({ nguoidaxoa: newArr }).eq('matinnhan', m.matinnhan);
            }));
        }

        return NextResponse.json({ success: true, message: 'Deleted' }, { status: 200 });
    } catch (error: any) {
        console.error("Lỗi DELETE API chat-rooms:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}