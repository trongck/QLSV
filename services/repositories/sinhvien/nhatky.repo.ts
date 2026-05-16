// repositories/sinhvien/nhatky.repo.ts
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

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
        const now = new Date().toISOString();
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
        const updateData: Record<string, unknown> = {
            ngaycapnhat: new Date().toISOString(),
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
};
