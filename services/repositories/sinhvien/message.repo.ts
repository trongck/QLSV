// services/repositories/sinhvien/message.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';
import { logAuditAction } from '@/lib/utils/audit';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

export interface SendMessageDto {
    macuoctrochuyen: number;
    mataikhoangui: string;
    noidung: string;
    filedinh?: string | null;
}

export const messageRepo = {
    // 1. Lấy tất cả thanhvientrochuyen của một tài khoản
    getRoomsForUser: async (userId: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .select('macuoctrochuyen, thoigianxemcuoi')
            .eq('mataikhoan', userId);
    },

    // 2. Lấy thông tin các cuộc trò chuyện theo IDs kèm tin nhắn và thành viên
    getConversationsDetail: async (conversationIds: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('cuoctrochuyen')
            .select(`
                macuoctrochuyen,
                tieude,
                loai,
                ngaytao,
                nguoidaxoa,
                thanhvientrochuyen (
                    mataikhoan,
                    vaitro,
                    thoigianxemcuoi,
                    ngaythamgia,
                    taikhoan:mataikhoan (
                        mataikhoan,
                        email,
                        vaitro,
                        sinhvien (hodem, ten, emailtruong, anhdaidien, masv),
                        giangvien (hodem, ten, emailtruong, anhdaidien, magv)
                    )
                ),
                tinnhan (
                    matinnhan,
                    noidung,
                    filedinh,
                    mataikhoangui,
                    ngaytao,
                    nguoidaxoa
                )
            `)
            .in('macuoctrochuyen', conversationIds);
    },

    // 3. Tìm cuộc trò chuyện cá nhân giữa 2 người
    findSharedPersonalConversation: async (myUserId: string, otherUserId: string) => {
        const supabase = await getSupabase();
        // Lấy danh sách conversationIds của tôi
        const { data: myConvs } = await supabase
            .from('thanhvientrochuyen')
            .select('macuoctrochuyen')
            .eq('mataikhoan', myUserId);
        const myConvIds = (myConvs ?? []).map((r) => r.macuoctrochuyen);
        if (myConvIds.length === 0) return null;

        // Lấy cuộc trò chuyện chung mà người kia cũng tham gia
        const { data: sharedConvs } = await supabase
            .from('thanhvientrochuyen')
            .select('macuoctrochuyen')
            .eq('mataikhoan', otherUserId)
            .in('macuoctrochuyen', myConvIds);
        if (!sharedConvs || sharedConvs.length === 0) return null;

        // Tìm cuộc trò chuyện loại CaNhan
        const { data: existingConvs } = await supabase
            .from('cuoctrochuyen')
            .select('macuoctrochuyen, tieude, loai, ngaytao, nguoidaxoa')
            .in('macuoctrochuyen', sharedConvs.map((r) => r.macuoctrochuyen))
            .eq('loai', 'CaNhan')
            .limit(1);

        return existingConvs && existingConvs.length > 0 ? existingConvs[0] : null;
    },

    // 4. Cập nhật nguoidaxoa trong cuoctrochuyen
    updateConversationDeletedUsers: async (convId: number, deletedUsers: string[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('cuoctrochuyen')
            .update({ nguoidaxoa: deletedUsers })
            .eq('macuoctrochuyen', convId)
            .select()
            .single();
    },

    // 5. Tạo cuộc trò chuyện mới
    createConversation: async (loai: 'CaNhan' | 'Nhom', tieude: string | null, ngaytaoStr: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('cuoctrochuyen')
            .insert({ loai, tieude, ngaytao: ngaytaoStr })
            .select('macuoctrochuyen, tieude, loai, ngaytao')
            .single();
    },

    // 6. Thêm thành viên vào cuộc trò chuyện
    addConversationMembers: async (members: { macuoctrochuyen: number; mataikhoan: string; vaitro: string }[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .insert(members);
    },

    // 7. Lấy tin nhắn của cuộc trò chuyện (có lọc theo nguoidaxoa nếu cần)
    getMessages: async (convId: number, userId?: string) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('tinnhan')
            .select('matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao', { count: 'exact' })
            .eq('macuoctrochuyen', convId);

        if (userId) {
            query = query.not('nguoidaxoa', 'cs', `{${userId}}`);
        }

        return await query.order('ngaytao', { ascending: true });
    },

    // 8. Lấy tin nhắn phân trang
    getMessagesPaginated: async (convId: number, offset: number, limit: number, userId?: string) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('tinnhan')
            .select('matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao', { count: 'exact' })
            .eq('macuoctrochuyen', convId);

        if (userId) {
            query = query.not('nguoidaxoa', 'cs', `{${userId}}`);
        }

        return await query
            .order('ngaytao', { ascending: true })
            .range(offset, offset + limit - 1);
    },

    // 9. Cập nhật thời gian xem cuối của thành viên
    updateMemberLastView: async (convId: number, userId: string, viewTimeStr: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .update({ thoigianxemcuoi: viewTimeStr })
            .eq('macuoctrochuyen', convId)
            .eq('mataikhoan', userId);
    },

    // 10. Tạo tin nhắn mới
    insertMessage: async (dto: SendMessageDto, timeStr: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .insert({
                macuoctrochuyen: dto.macuoctrochuyen,
                mataikhoangui: dto.mataikhoangui,
                noidung: dto.noidung || '',
                filedinh: dto.filedinh || null,
                dachinh: false,
                ngaytao: timeStr,
                ngaycapnhat: timeStr
            })
            .select('matinnhan, macuoctrochuyen, mataikhoangui, noidung, filedinh, dachinh, ngaytao')
            .single();
    },

    // 11. Khôi phục hiển thị cuộc trò chuyện cho mọi người (nguoidaxoa = [])
    restoreConversationVisibility: async (convId: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('cuoctrochuyen')
            .update({ nguoidaxoa: [] })
            .eq('macuoctrochuyen', convId);
    },

    // 12. Lấy thông tin tài khoản đầy đủ cho logging/audit
    getAccountDetailForLog: async (userId: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('taikhoan')
            .select('email, sinhvien(hodem, ten, masv), giangvien(hodem, ten, magv), admin(hoten, maadmin)')
            .eq('mataikhoan', userId)
            .single();
    },

    // 13. Lấy tất cả thành viên trong cuộc trò chuyện
    getConversationMembers: async (convId: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .select('mataikhoan')
            .eq('macuoctrochuyen', convId);
    },

    // 14. Lấy tin nhắn của cuộc trò chuyện (chỉ IDs + nguoidaxoa) để cập nhật xóa
    getMessageIdsForDeletion: async (convId: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .select('matinnhan, nguoidaxoa')
            .eq('macuoctrochuyen', convId);
    },

    // 15. Cập nhật nguoidaxoa của tin nhắn
    updateMessageDeletedUsers: async (msgId: number, deletedUsers: string[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .update({ nguoidaxoa: deletedUsers })
            .eq('matinnhan', msgId);
    },

    // 15b. Lấy chi tiết tin nhắn (chỉ lấy nguoidaxoa) để check trước khi ẩn/xóa
    getMessageDetail: async (msgId: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .select('matinnhan, nguoidaxoa')
            .eq('matinnhan', msgId)
            .single();
    },

    // 16. Tìm kiếm sinh viên
    searchStudents: async (search: string, limit: number) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('sinhvien')
            .select('masv, hodem, ten, anhdaidien, emailtruong, lop:malop ( tenlop ), mataikhoan');
        if (search.trim()) {
            query = query.or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,masv.ilike.%${search}%`);
        }
        return await query.limit(limit);
    },

    // 17. Tìm kiếm giảng viên
    searchTeachers: async (search: string, limit: number) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('giangvien')
            .select('magv, hodem, ten, anhdaidien, emailtruong, khoa:makhoa ( tenkhoa ), mataikhoan');
        if (search.trim()) {
            query = query.or(`hodem.ilike.%${search}%,ten.ilike.%${search}%,magv.ilike.%${search}%`);
        }
        return await query.limit(limit);
    },

    // 18. Lấy chi tiết thành viên cuộc trò chuyện
    getConversationMembersDetail: async (convId: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from("thanhvientrochuyen")
            .select(`
              mataikhoan, 
              vaitro, 
              ngaythamgia, 
              thoigianxemcuoi,
              taikhoan (
                email,
                vaitro,
                sinhvien (masv, hoten, anhdaidien, emailtruong),
                giangvien (magv, hoten, anhdaidien, emailtruong),
                admin (maadmin, hoten)
              )
            `)
            .eq("macuoctrochuyen", convId);
    },

    // 19. Tải lên tệp đính kèm tin nhắn lên Storage
    uploadMessageFile: async (filePath: string, buffer: Uint8Array, contentType: string) => {
        const supabase = await getSupabase();
        return await supabase.storage
            .from("attachments")
            .upload(filePath, buffer, {
                contentType,
                upsert: false,
            });
    },

    // 20. Lấy URL công khai của tệp tin nhắn
    getPublicUrl: async (filePath: string) => {
        const supabase = await getSupabase();
        return supabase.storage
            .from("attachments")
            .getPublicUrl(filePath);
    },

    // 21. Ghi nhật ký thao tác tin nhắn
    logAudit: async (mataikhoan: string, hanhdong: string, tentable: string, makhoachinh: string, request: Request) => {
        const supabase = await getSupabase();
        await logAuditAction({
            supabase,
            mataikhoan,
            hanhdong,
            tentable,
            makhoachinh,
            request
        });
    }
};