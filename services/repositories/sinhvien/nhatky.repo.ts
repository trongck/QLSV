// repositories/sinhvien/nhatky.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';
import { logAuditAction } from '@/lib/utils/audit';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

export interface CreateNoteDto {
    tieude?: string | null;
    noidung?: string;
    tamtrang?: 1 | 2 | 3 | 4 | 5 | null;
    maphancong?: number | null;
    magv?: string | null;
}

export interface UpdateNoteDto {
    tieude?: string | null;
    noidung?: string;
    tamtrang?: 1 | 2 | 3 | 4 | 5 | null;
    maphancong?: number | null;
    magv?: string | null;
}

const SELECT_FIELDS = `
    manhatky, masv, magv, tieude, noidung,
    tamtrang, maphancong, ngaytao, ngaycapnhat,
    phancong:maphancong (
        maphancong,
        monhoc:mamon ( mamon, tenmon ),
        lop:malop ( malop, tenlop )
    )
`;

export const nhatkyRepo = {
    getAllByStudent: async (masv: string, maphancong?: number) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('nhatky')
            .select(SELECT_FIELDS)
            .eq('masv', masv)
            .order('ngaytao', { ascending: false });

        if (maphancong !== undefined) {
            query = query.eq('maphancong', maphancong);
        }
        return await query;
    },

    getAllByStudentPaged: async (params: {
        masv: string;
        search?: string;
        limit?: number;
        offset?: number;
    }) => {
        const supabase = await getSupabase();
        let query = supabase
            .from('nhatky')
            .select('*', { count: 'exact' })
            .eq('masv', params.masv)
            .order('ngaycapnhat', { ascending: false });

        if (params.search) {
            query = query.or(`tieude.ilike.%${params.search}%,noidung.ilike.%${params.search}%`);
        }

        if (params.limit !== undefined && params.offset !== undefined) {
            query = query.range(params.offset, params.offset + params.limit - 1);
        }

        return await query;
    },

    getById: async (manhatky: number, masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nhatky')
            .select(SELECT_FIELDS)
            .eq('manhatky', manhatky)
            .eq('masv', masv)
            .single();
    },

    create: async (masv: string, dto: CreateNoteDto) => {
        const supabase = await getSupabase();
        const now = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        return await supabase
            .from('nhatky')
            .insert([{
                masv,
                magv: dto.magv ?? null,
                tieude: dto.tieude ?? null,
                noidung: dto.noidung ?? '',
                tamtrang: dto.tamtrang ?? null,
                maphancong: dto.maphancong ?? null,
                ngaytao: now,
                ngaycapnhat: now,
            }])
            .select(SELECT_FIELDS)
            .single();
    },

    update: async (manhatky: number, masv: string, dto: UpdateNoteDto) => {
        const supabase = await getSupabase();
        const vnNow = new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        const updateData: Record<string, unknown> = {
            ngaycapnhat: vnNow,
        };
        if (dto.tieude !== undefined) updateData.tieude = dto.tieude;
        if (dto.noidung !== undefined) updateData.noidung = dto.noidung;
        if (dto.tamtrang !== undefined) updateData.tamtrang = dto.tamtrang;
        if (dto.maphancong !== undefined) updateData.maphancong = dto.maphancong;
        if (dto.magv !== undefined) updateData.magv = dto.magv;

        return await supabase
            .from('nhatky')
            .update(updateData)
            .eq('manhatky', manhatky)
            .eq('masv', masv)
            .select(SELECT_FIELDS)
            .single();
    },

    delete: async (manhatky: number, masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nhatky')
            .delete()
            .eq('manhatky', manhatky)
            .eq('masv', masv);
    },

    logAudit: async (
        mataikhoan: string,
        hanhdong: string,
        tentable: string,
        makhoachinh: string,
        giatrimoi: any,
        request: Request
    ) => {
        const supabase = await getSupabase();
        await logAuditAction({
            supabase,
            mataikhoan,
            hanhdong,
            tentable,
            makhoachinh,
            giatrimoi,
            request
        });
    }
};
