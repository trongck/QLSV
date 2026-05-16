// services/sinhvien/nhatky.service.ts
import { nhatkyRepo, CreateNoteDto, UpdateNoteDto } from '@/services/repositories/sinhvien/nhatky.repo';

export const nhatkyService = {
    getAll: async (masv: string, maphancong?: number) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await nhatkyRepo.getAllByStudent(masv, maphancong);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getById: async (manhatky: number, masv: string) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { data, error } = await nhatkyRepo.getById(manhatky, masv);
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Không tìm thấy nhật ký');
        return data;
    },

    create: async (masv: string, dto: CreateNoteDto) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await nhatkyRepo.create(masv, dto);
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (manhatky: number, masv: string, dto: UpdateNoteDto) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { data, error } = await nhatkyRepo.update(manhatky, masv, dto);
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (manhatky: number, masv: string) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { error } = await nhatkyRepo.delete(manhatky, masv);
        if (error) throw new Error(error.message);
        return { success: true };
    },
};
