// services/sinhvien/nhatky.service.ts
import { nhatkyRepo, CreateNoteDto, UpdateNoteDto } from '@/services/repositories/sinhvien/nhatky.repo';

export const nhatkyService = {
    getAll: async (masv: string, maphancong?: number) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await nhatkyRepo.getAllByStudent(masv, maphancong);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getPaged: async (params: {
        masv: string;
        search?: string;
        limit?: number;
        offset?: number;
    }) => {
        if (!params.masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error, count } = await nhatkyRepo.getAllByStudentPaged(params);
        if (error) throw new Error(error.message);
        return { data: data ?? [], count: count ?? 0 };
    },

    getById: async (manhatky: number, masv: string) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { data, error } = await nhatkyRepo.getById(manhatky, masv);
        if (error) throw new Error(error.message);
        if (!data) throw new Error('Không tìm thấy nhật ký');
        return data;
    },

    create: async (
        masv: string,
        dto: CreateNoteDto,
        auditParams?: { mataikhoan: string; tenSinhVien: string; request: Request }
    ) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        const { data, error } = await nhatkyRepo.create(masv, dto);
        if (error) throw new Error(error.message);

        if (auditParams) {
            await nhatkyRepo.logAudit(
                auditParams.mataikhoan,
                `Sinh viên [${auditParams.tenSinhVien}] đã thêm nhật ký mới`,
                'nhatky',
                String(data.manhatky),
                data,
                auditParams.request
            );
        }
        return data;
    },

    update: async (
        manhatky: number,
        masv: string,
        dto: UpdateNoteDto,
        auditParams?: { mataikhoan: string; tenSinhVien: string; request: Request }
    ) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { data, error } = await nhatkyRepo.update(manhatky, masv, dto);
        if (error) throw new Error(error.message);

        if (auditParams) {
            await nhatkyRepo.logAudit(
                auditParams.mataikhoan,
                `Sinh viên [${auditParams.tenSinhVien}] đã cập nhật nhật ký`,
                'nhatky',
                String(manhatky),
                data,
                auditParams.request
            );
        }
        return data;
    },

    delete: async (
        manhatky: number,
        masv: string,
        auditParams?: { mataikhoan: string; tenSinhVien: string; request: Request }
    ) => {
        if (!manhatky || !masv) throw new Error('Thiếu thông tin');
        const { error } = await nhatkyRepo.delete(manhatky, masv);
        if (error) throw new Error(error.message);

        if (auditParams) {
            await nhatkyRepo.logAudit(
                auditParams.mataikhoan,
                `Sinh viên [${auditParams.tenSinhVien}] đã xóa nhật ký`,
                'nhatky',
                String(manhatky),
                null,
                auditParams.request
            );
        }
        return { success: true };
    },
};
