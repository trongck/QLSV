// services/repositories/sinhvien/student.repo.ts
// Repository chứa toàn bộ truy vấn Supabase dành cho sinh viên:
// Hồ sơ, Dashboard, Lịch học, Điểm, Bài tập, Tin nhắn, Điểm danh
import { createClient } from '@/lib/utils/supabase/server';
import { cookies } from 'next/headers';

async function getSupabase() {
    const cookieStore = await cookies();
    return createClient(cookieStore);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UpdateProfileDto {
    hodem?: string | null;
    ten?: string | null;
    ngaysinh?: string | null;
    gioitinh?: 'Nam' | 'Nu' | 'Khac' | null;
    anhdaidien?: string | null;
    diachithuongtru?: string | null;
    diachitamtru?: string | null;
    sodienthoai?: string | null;
    emailcanhan?: string | null;
    tenphuhuynh?: string | null;
    sodienthoaiphuhuynh?: string | null;
    cccd?: string | null;
    ngaycapcccd?: string | null;
    noicapcccd?: string | null;
    dantoc?: string | null;
    tongiao?: string | null;
    face_embedding?: number[] | null;
}

export const studentRepo = {

    // ─── Hồ sơ sinh viên ─────────────────────────────────────────────────────

    /** Lấy hồ sơ sinh viên theo mataikhoan */
    getProfileByAccount: async (mataikhoan: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('sinhvien')
            .select(`
                masv, mataikhoan, malop, hodem, ten,
                ngaysinh, gioitinh, anhdaidien, emailtruong, trangthai,
                diachithuongtru, diachitamtru, sodienthoai, emailcanhan,
                tenphuhuynh, sodienthoaiphuhuynh, cccd, ngaycapcccd,
                noicapcccd, dantoc, tongiao, face_embedding
            `)
            .eq('mataikhoan', mataikhoan)
            .single();
    },

    /** Lấy thông tin cơ bản sinh viên (masv, malop) từ mataikhoan */
    getBasicInfoByAccount: async (mataikhoan: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('sinhvien')
            .select('masv, malop, hodem, ten')
            .eq('mataikhoan', mataikhoan)
            .single();
    },

    /** Lấy masv + malop để dùng trong các query khác */
    getMaSVByAccount: async (mataikhoan: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('sinhvien')
            .select('masv, malop')
            .eq('mataikhoan', mataikhoan)
            .single();
    },

    /** Cập nhật thông tin hồ sơ sinh viên */
    updateProfile: async (mataikhoan: string, dto: UpdateProfileDto) => {
        const supabase = await getSupabase();
        return await supabase
            .from('sinhvien')
            .update(dto)
            .eq('mataikhoan', mataikhoan);
    },

    // ─── Dashboard ────────────────────────────────────────────────────────────

    /** Đếm số môn sinh viên đang học trong học kỳ hiện tại */
    getMonHocDangHoc: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', masv)
            .eq('trangthai', 'Danghoc');
    },

    /** Lấy điểm gần đây (có giới hạn bản ghi) */
    getDiemGanDay: async (masv: string, limit = 6) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diem')
            .select('loaidiem, giatri, maphancong')
            .eq('masv', masv)
            .order('ngaytao', { ascending: false })
            .limit(limit);
    },

    /** Đếm số buổi vắng mặt */
    getDemVangMat: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diemdanh')
            .select('trangthai')
            .eq('masv', masv)
            .eq('trangthai', 'Vangmat');
    },

    /** Lấy danh sách bài tập chưa nộp */
    getBaiTapTheoMonHoc: async (maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('baitap')
            .select('mabaitap')
            .in('maphancong', maphancongList);
    },

    /** Lấy danh sách bài đã nộp của sinh viên */
    getBaiDaNop: async (masv: string, maBTs: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .select('mabaitap')
            .eq('masv', masv)
            .in('mabaitap', maBTs);
    },

    // ─── Lịch học ─────────────────────────────────────────────────────────────

    /** Lấy lịch học hôm nay bằng cách join trực tiếp các bảng thay vì dùng view lichhocsinhvien */
    getLichHocHomNay: async (masv: string, dbDay: number) => {
        const supabase = await getSupabase();
        
        // 1. Lấy danh sách maphancong của sinh viên đang học
        const { data: svMonHoc, error: svError } = await supabase
            .from('sinhvienmonhoc')
            .select('maphancong')
            .eq('masv', masv)
            .eq('trangthai', 'Danghoc');
        
        if (svError) {
            return { data: null, error: svError };
        }
        if (!svMonHoc || svMonHoc.length === 0) {
            return { data: [], error: null };
        }

        const maphancongList = svMonHoc.map(m => m.maphancong);

        // 2. Lấy chi tiết lịch học theo các maphancong
        const { data: lichRows, error: lhError } = await supabase
            .from('lichhoc')
            .select(`
                maphong,
                tietbatdau,
                tietketthuc,
                phancong (
                    monhoc (
                        tenmon
                    )
                )
            `)
            .in('maphancong', maphancongList)
            .eq('thutrongtuan', dbDay)
            .order('tietbatdau', { ascending: true });

        if (lhError) {
            return { data: null, error: lhError };
        }

        // 3. Map về cấu trúc dữ liệu tương thích
        const mappedData = (lichRows ?? []).map((row: any) => ({
            tenmon: row.phancong?.monhoc?.tenmon ?? "Môn học",
            phonghoc: row.maphong,
            tietbatdau: row.tietbatdau,
            tietketthuc: row.tietketthuc
        }));

        return { data: mappedData, error: null };
    },

    /** Lấy lịch học cả tuần từ lichhoc join phancong */
    getLichHocCaTuan: async (maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('lichhoc')
            .select(`
                malichhoc, maphancong, thutrongtuan,
                tietbatdau, tietketthuc, maphong, ghichu,
                phancong (
                    mamon, malop, malophoc,
                    monhoc ( tenmon, sotinchi )
                )
            `)
            .in('maphancong', maphancongList)
            .order('thutrongtuan', { ascending: true })
            .order('tietbatdau', { ascending: true });
    },

    // ─── Điểm số ──────────────────────────────────────────────────────────────

    /** Lấy toàn bộ điểm chi tiết (từng thành phần) */
    getDiemChiTiet: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diem')
            .select(`
                madiem, loaidiem, giatri, heso, ghichu, ngaytao, maphancong,
                phancong (
                    mamon, malophoc,
                    monhoc ( tenmon, sotinchi )
                )
            `)
            .eq('masv', masv)
            .order('ngaytao', { ascending: false });
    },

    /** Lấy điểm tổng kết theo từng môn */
    getDiemTongKet: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diemtongket')
            .select(`
                maphancong, diemtongket, diemchu, ketqua, ngaycapnhat,
                phancong (
                    mamon, malophoc,
                    monhoc ( tenmon, sotinchi )
                )
            `)
            .eq('masv', masv)
            .order('ngaycapnhat', { ascending: false });
    },

    // ─── Bài tập & Nộp bài ────────────────────────────────────────────────────

    /** Lấy toàn bộ bài tập của các môn sinh viên đang học */
    getBaiTapDayDu: async (maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('baitap')
            .select(`
                mabaitap, maphancong, tieude, mota, filedinh,
                hannop, diemtoida, loai, ngaytao,
                phancong (
                    mamon, malophoc,
                    monhoc ( tenmon ),
                    giangvien:magv ( magv, hodem, ten )
                )
            `)
            .in('maphancong', maphancongList)
            .order('hannop', { ascending: true });
    },

    /** Lấy danh sách bài đã nộp kèm thông tin chấm điểm */
    getNopBaiTheoMaBT: async (masv: string, maBTs: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .select('mabaitap, manopbai, thoigiannop, trenop, diem, nhanxet, filenop, noidungnop')
            .eq('masv', masv)
            .in('mabaitap', maBTs);
    },

    /** Lấy thông tin hạn nộp của một bài tập */
    getBaiTapById: async (mabaitap: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('baitap')
            .select('mabaitap, hannop')
            .eq('mabaitap', mabaitap)
            .single();
    },

    /** Kiểm tra sinh viên đã nộp bài chưa */
    checkNopBai: async (masv: string, mabaitap: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .select('manopbai')
            .eq('mabaitap', mabaitap)
            .eq('masv', masv)
            .maybeSingle();
    },

    /** Cập nhật bài nộp */
    updateNopBai: async (manopbai: number, payload: {
        noidungnop: string | null;
        filenop: string | null;
        thoigiannop: string;
        trenop: boolean;
    }) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .update(payload)
            .eq('manopbai', manopbai);
    },

    /** Tạo bài nộp mới */
    insertNopBai: async (payload: {
        mabaitap: number;
        masv: string;
        noidungnop: string | null;
        filenop: string | null;
        thoigiannop: string;
        trenop: boolean;
    }) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .insert(payload);
    },

    /** Lấy lịch sử bài nộp của sinh viên */
    getMySubmissions: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('nopbai')
            .select(`
                manopbai, mabaitap, noidungnop, filenop,
                thoigiannop, trenop, diem, nhanxet, thoigiancham,
                baitap ( tieude, hannop, diemtoida )
            `)
            .eq('masv', masv)
            .order('thoigiannop', { ascending: false });
    },

    // ─── Tin nhắn & Cuộc trò chuyện ───────────────────────────────────────────

    /** Lấy danh sách cuộc trò chuyện sinh viên đã tham gia */
    getMemberships: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .select('macuoctrochuyen, thoigianxemcuoi')
            .eq('masv', masv);
    },

    /** Lấy danh sách cuộc trò chuyện theo id */
    getConversations: async (conversationIds: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('cuoctrochuyen')
            .select('macuoctrochuyen, tieude, loai, ngaytao, maphancong')
            .in('macuoctrochuyen', conversationIds)
            .order('ngaytao', { ascending: false });
    },

    /** Lấy tin nhắn cuối cùng trong một cuộc trò chuyện */
    getLastMessage: async (macuoctrochuyen: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .select('noidung, ngaytao, masvgui, magvgui')
            .eq('macuoctrochuyen', macuoctrochuyen)
            .order('ngaytao', { ascending: false })
            .limit(1)
            .maybeSingle();
    },

    /** Đếm tin nhắn chưa đọc trong một cuộc trò chuyện */
    countUnreadMessages: async (macuoctrochuyen: number, since: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .select('matinnhan', { count: 'exact', head: true })
            .eq('macuoctrochuyen', macuoctrochuyen)
            .gt('ngaytao', since);
    },

    /** Kiểm tra sinh viên có thuộc cuộc trò chuyện không */
    checkMembership: async (masv: string, macuoctrochuyen: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .select('masv')
            .eq('macuoctrochuyen', macuoctrochuyen)
            .eq('masv', masv)
            .maybeSingle();
    },

    /** Cập nhật thời gian xem cuối của sinh viên trong cuộc trò chuyện */
    updateXemCuoi: async (masv: string, macuoctrochuyen: number, thoigian: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thanhvientrochuyen')
            .update({ thoigianxemcuoi: thoigian })
            .eq('macuoctrochuyen', macuoctrochuyen)
            .eq('masv', masv);
    },

    /** Lấy tin nhắn trong cuộc trò chuyện */
    getMessages: async (macuoctrochuyen: number, limit = 100) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .select(`
                matinnhan, noidung, filedinh, dachinh, ngaytao, masvgui, magvgui
            `)
            .eq('macuoctrochuyen', macuoctrochuyen)
            .order('ngaytao', { ascending: true })
            .limit(limit);
    },

    /** Gửi tin nhắn */
    insertMessage: async (payload: {
        macuoctrochuyen: number;
        masvgui: string;
        noidung: string;
        filedinh?: string | null;
        dachinh?: boolean;
    }) => {
        const supabase = await getSupabase();
        return await supabase
            .from('tinnhan')
            .insert({
                ...payload,
                dachinh: payload.dachinh ?? false,
            })
            .select()
            .single();
    },

    // ─── Thông báo ─────────────────────────────────────────────────────────────

    /** Lấy thông báo dành cho sinh viên theo lớp + môn học */
    getThongBao: async (conditions: string[], limit = 30) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbao')
            .select(`
                mathongbao, tieude, noidung, loai, doituong,
                ghim, ngaytao, ngayhethan
            `)
            .or(conditions.join(','))
            .order('ghim', { ascending: false })
            .order('ngaytao', { ascending: false })
            .limit(limit);
    },

    /** Lấy trạng thái đã đọc thông báo */
    getDaDocThongBao: async (masv: string, mathongbaoIds: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbaodadocsv')
            .select('mathongbao, dadoc')
            .eq('masv', masv)
            .in('mathongbao', mathongbaoIds);
    },

    /** Kiểm tra tồn tại bản ghi đã đọc */
    checkDaDoc: async (masv: string, mathongbao: number) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbaodadocsv')
            .select('mathongbao')
            .eq('masv', masv)
            .eq('mathongbao', mathongbao)
            .maybeSingle();
    },

    /** Cập nhật trạng thái đã đọc thông báo */
    updateDaDoc: async (masv: string, mathongbao: number, thoigian: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbaodadocsv')
            .update({ dadoc: true, thoigiandoc: thoigian })
            .eq('masv', masv)
            .eq('mathongbao', mathongbao);
    },

    /** Thêm bản ghi đã đọc thông báo */
    insertDaDoc: async (masv: string, mathongbao: number, thoigian: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('thongbaodadocsv')
            .insert({ mathongbao, masv, dadoc: true, thoigiandoc: thoigian });
    },

    // ─── Lịch sử điểm danh ────────────────────────────────────────────────────

    /** Lấy lịch sử điểm danh của sinh viên */
    getLichSuDiemDanh: async (masv: string, limit = 100) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diemdanh')
            .select(`
                madiemdanh, trangthai, ghichu, thoigiandiemdanh, phuongthuc, ngaytao,
                buoihoc (
                    mabuoihoc, ngayhoc, noidung,
                    lichhoc (
                        maphong,
                        phancong (
                            mamon, malophoc,
                            monhoc ( tenmon )
                        )
                    )
                )
            `)
            .eq('masv', masv)
            .order('ngaytao', { ascending: false })
            .limit(limit);
    },

    // ─── Điểm số chi tiết và GPA ──────────────────────────────────────────────

    getHocKyList: async () => {
        const supabase = await getSupabase();
        return await supabase
            .from('hocky')
            .select('mahocky, tenhocky, namhoc, ky, danghieuluc')
            .order('namhoc', { ascending: false })
            .order('ky', { ascending: false });
    },

    getDiemTongKetRaw: async (masv: string) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diemtongket')
            .select('maphancong, diemtongket, diemchu, ketqua')
            .eq('masv', masv);
    },

    getPhanCongWithMonHocAndHocKy: async (maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('phancong')
            .select(`
                maphancong,
                mamon,
                mahocky,
                monhoc:mamon ( sotinchi ),
                hocky:mahocky ( danghieuluc )
            `)
            .in('maphancong', maphancongList);
    },

    getPhanCongWithGiangVien: async (maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('phancong')
            .select(`
                maphancong,
                mahocky,
                malophoc,
                mamon,
                monhoc:mamon ( tenmon, sotinchi ),
                giangvien:magv ( hodem, ten )
            `)
            .in('maphancong', maphancongList);
    },

    getDiemThanhPhan: async (masv: string, maphancongList: number[]) => {
        const supabase = await getSupabase();
        return await supabase
            .from('diem')
            .select('maphancong, loaidiem, giatri, heso')
            .eq('masv', masv)
            .in('maphancong', maphancongList);
    },

    uploadFile: async (filePath: string, buffer: Uint8Array, contentType: string) => {
        const supabase = await getSupabase();
        return await supabase.storage
            .from('attachments')
            .upload(filePath, buffer, {
                contentType,
                upsert: false,
            });
    },

    getPublicUrl: async (filePath: string) => {
        const supabase = await getSupabase();
        return supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);
    },
};
