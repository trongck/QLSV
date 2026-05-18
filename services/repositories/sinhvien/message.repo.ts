// services/repositories/sinhvien/message.repo.ts
import { createClient } from '@/lib/utils/supabase/client';

// Khởi tạo supabase từ hàm createClient()
const supabase = createClient();

export const messageRepo = {
    // Lấy tin nhắn theo mã cuộc trò chuyện
    getMessagesByRoomId: async (roomId: number) => {
        return await supabase
            .from('tinnhan')
            .select('*')
            .eq('macuoctrochuyen', roomId)
            .order('ngaytao', { ascending: true });
    },

    // Thêm tin nhắn mới
    createMessage: async (roomId: number, mataikhoan: string, content: string) => {
        return await supabase
            .from('tinnhan')
            .insert([{
                macuoctrochuyen: roomId,
                mataikhoangui: mataikhoan,
                noidung: content,
                dachinh: false,
                ngaytao: new Date().toISOString()
            }])
            .select();
    }
};