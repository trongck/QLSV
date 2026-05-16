// services/sinhvien/message.service.ts
import { messageRepo } from '@/services/repositories/sinhvien/message.repo';

export const messageService = {
    getRoomMessages: async (roomId: number) => {
        if (!roomId) throw new Error('Mã cuộc trò chuyện không hợp lệ');
        const { data, error } = await messageRepo.getMessagesByRoomId(roomId);
        if (error) throw new Error(error.message);
        return data;
    },

    sendMessage: async (roomId: number, studentId: string, content: string) => {
        if (!roomId || !studentId || !content.trim()) throw new Error('Dữ liệu không hợp lệ');
        const { data, error } = await messageRepo.createMessage(roomId, studentId, content);
        if (error) throw new Error(error.message);
        return data[0];
    }
};