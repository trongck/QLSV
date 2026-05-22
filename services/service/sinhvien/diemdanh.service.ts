// services/service/sinhvien/diemdanh.service.ts
// Service layer cho điểm danh sinh viên — gọi diemdanhRepo, không truy cập DB trực tiếp.
import { diemdanhRepo, PhuongThucDiemDanh } from '@/services/repositories/sinhvien/diemdanh.repo';
import { validateQRToken, validateLeaveRequest } from '@/lib/validation/sinhvien';
import { studentRepo } from '@/services/repositories/sinhvien/student.repo';

export const diemdanhService = {

    /**
     * Lấy đầy đủ dữ liệu điểm danh phục vụ cho giao diện cũ (học kỳ, thống kê, lịch sử, buổi học hiện tại)
     */
    getAttendanceFullData: async (mataikhoan: string, mahockyParam?: number) => {
        // 1. Lấy thông tin sinh viên
        const { data: sv, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !sv) throw new Error('Không tìm thấy thông tin sinh viên');
        const masv = sv.masv;

        // 2. Lấy danh sách học kỳ
        const { data: dsHocKy, error: hkError } = await diemdanhRepo.getHocKyList();
        if (hkError) throw new Error(hkError.message);
        const hocKyList = dsHocKy ?? [];

        // Xác định học kỳ đang chọn
        let mahocky: number;
        if (mahockyParam) {
            mahocky = mahockyParam;
        } else {
            const active = hocKyList.find((hk) => hk.danghieuluc);
            mahocky = active ? active.mahocky : (hocKyList[0]?.mahocky ?? 0);
        }

        const hocKyHienTai = hocKyList.find((hk) => hk.mahocky === mahocky) ?? null;

        // 3. Lấy lịch sử điểm danh raw
        const { data: rawDiemDanh, error: ddError } = await diemdanhRepo.getRawAttendanceHistory(masv);
        if (ddError) throw new Error(ddError.message);

        // Lọc theo học kỳ
        const filtered = (rawDiemDanh as any[] ?? []).filter((row) => {
            const pc = row.buoihoc?.lichhoc?.phancong;
            return pc?.mahocky === mahocky;
        });

        const TIET_TIME: Record<number, string> = {
            1: "07:00", 2: "07:50", 3: "08:40", 4: "09:30", 5: "10:20",
            6: "11:10", 7: "13:00", 8: "13:50", 9: "14:40", 10: "15:30",
            11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
        };

        const tietToTime = (tiet: number): string => {
            return TIET_TIME[tiet] ?? `${tiet}:00`;
        };

        // Map sang history items
        const history = filtered.map((row: any) => {
            const buoi = row.buoihoc;
            const lich = buoi?.lichhoc;
            const pc = lich?.phancong;
            const ngayhoc = new Date(buoi?.ngayhoc);

            return {
                madiemdanh: row.madiemdanh,
                mabuoihoc: buoi?.mabuoihoc,
                ngayhoc: buoi?.ngayhoc,
                day: String(ngayhoc.getDate()).padStart(2, "0"),
                month: `T${String(ngayhoc.getMonth() + 1).padStart(2, "0")}`,
                tenmon: pc?.monhoc?.tenmon ?? "Chưa có tên môn",
                giangvien: pc?.giangvien ? ([pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Đang cập nhật") : "Đang cập nhật",
                phonghoc: lich?.maphong ?? "---",
                gioVao: tietToTime(lich?.tietbatdau ?? 1),
                gioRa: tietToTime(lich?.tietketthuc ?? 1),
                thoigiandiemdanh: row.thoigiandiemdanh,
                trangthai: row.trangthai,
                ghichu: row.ghichu,
            };
        });

        // Tính thống kê
        const total = history.length;
        const comat = history.filter((r) => r.trangthai === 'Comat').length;
        const vangmat = history.filter((r) => r.trangthai === 'Vangmat').length;
        const dimuon = history.filter((r) => r.trangthai === 'Dimuon').length;
        const cophep = history.filter((r) => r.trangthai === 'Cophep').length;
        const tilechuyencan = total > 0 ? Math.round(((comat + dimuon + cophep) / total) * 100) : 0;

        // 4. Tìm buổi học đang mở điểm danh cho sinh viên này
        const { data: svmonData } = await diemdanhRepo.getStudentMonHocDangHoc(masv);
        const lichHocIds = (svmonData as any[] ?? [])
            .filter((r) => r.phancong?.mahocky === mahocky)
            .flatMap((r: any) => r.phancong?.lichhoc?.map((l: any) => l.malichhoc) ?? []);

        let currentSession = null;

        if (lichHocIds.length > 0) {
            const { data: activeSession } = await diemdanhRepo.getActiveSession(lichHocIds);
            if (activeSession) {
                const { data: alreadyAttended } = await diemdanhRepo.checkExisting(masv, activeSession.mabuoihoc);
                if (!alreadyAttended) {
                    const s = activeSession as any;
                    const lich = s.lichhoc;
                    const pc = lich?.phancong;
                    const ngayhoc = new Date(s.ngayhoc);

                    currentSession = {
                        mabuoihoc: s.mabuoihoc,
                        ngayhoc: s.ngayhoc,
                        day: String(ngayhoc.getDate()).padStart(2, "0"),
                        month: `T${String(ngayhoc.getMonth() + 1).padStart(2, "0")}`,
                        tenmon: pc?.monhoc?.tenmon ?? "---",
                        giangvien: pc?.giangvien ? ([pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "---") : "---",
                        phonghoc: lich?.maphong ?? "---",
                        gioVao: tietToTime(lich?.tietbatdau ?? 1),
                        gioRa: tietToTime(lich?.tietketthuc ?? 1),
                        maphancong: pc?.maphancong,
                    };
                }
            }
        }

        return {
            hocKyList,
            mahocky,
            hocKy: hocKyHienTai,
            stats: { total, comat, vangmat, dimuon, cophep, tilechuyencan },
            currentSession,
            history,
        };
    },

    /**
     * Ghi nhận điểm danh cho sinh viên
     */
    checkInStudent: async (
        mataikhoan: string,
        mabuoihoc: number,
        phuongthuc: "qr" | "face",
        qr_data?: string,
        request?: Request
    ) => {
        // 1. Xác minh mã QR
        if (phuongthuc === "qr") {
            const decoded = qr_data?.trim();
            if (!decoded || String(mabuoihoc) !== decoded) {
                throw new Error("Mã QR không hợp lệ hoặc không khớp với buổi học.");
            }
        }

        // 2. Lấy thông tin sinh viên
        const { data: svData, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !svData) {
            throw new Error("Không tìm thấy thông tin sinh viên.");
        }
        const { masv } = svData;

        // 3. Kiểm tra buổi học tồn tại và đang mở
        const { data: buoiHoc, error: buoiError } = await diemdanhRepo.getBuoiHocWithLichHoc(mabuoihoc);
        if (buoiError || !buoiHoc) {
            throw new Error("Buổi học không tồn tại.");
        }

        const bh = buoiHoc as any;
        if (bh.trangthai !== 'DangDiemdanh') {
            const msg = bh.trangthai === 'Hoanthanh'
                ? "Buổi học đã kết thúc điểm danh."
                : "Buổi học chưa được mở điểm danh.";
            throw new Error(msg);
        }

        const maphancong = bh.lichhoc?.maphancong;

        // 4. Kiểm tra sinh viên đã đăng ký môn học
        const { data: enrolled } = await diemdanhRepo.checkRegistration(masv, maphancong);
        if (!enrolled) {
            throw new Error("Bạn không đăng ký môn học này.");
        }

        // 5. Kiểm tra chưa điểm danh buổi này
        const { data: existing } = await diemdanhRepo.checkExisting(masv, mabuoihoc);
        if (existing) {
            throw new Error("Bạn đã điểm danh buổi học này rồi.");
        }

        // 6. Xác định trạng thái: Đúng giờ hay Đi muộn (>10 phút)
        const TIET_TIME: Record<number, string> = {
            1: "07:00", 2: "07:50", 3: "08:40", 4: "09:30", 5: "10:20",
            6: "11:10", 7: "13:00", 8: "13:50", 9: "14:40", 10: "15:30",
            11: "16:20", 12: "17:10", 13: "18:00", 14: "18:50", 15: "19:40",
        };
        const now = new Date();
        const tietBatDau = bh.lichhoc?.tietbatdau ?? 1;
        const gioVao = TIET_TIME[tietBatDau] ?? "07:00";
        const [startHour, startMin] = gioVao.split(":").map(Number);

        // Ghép ngày học với giờ tiết bắt đầu
        const sessionStart = new Date(bh.ngayhoc);
        sessionStart.setHours(startHour, startMin + 10, 0, 0); // +10 phút ân hạn

        const trangThaiDiemDanh = now > sessionStart ? 'Dimuon' : 'Comat';

        // 7. Ghi nhận điểm danh
        const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");
        const { data: newDiemDanh, error: insertError } = await diemdanhRepo.insertAttendanceRecord({
            mabuoihoc,
            masv,
            trangthai: trangThaiDiemDanh,
            ghichu: `Điểm danh qua ${phuongthuc === "qr" ? "mã QR" : "nhận dạng khuôn mặt"}`,
            thoigiandiemdanh: vnNow,
            ngaytao: vnNow,
        });

        if (insertError) {
            throw new Error(insertError.message);
        }

        if (request) {
            await diemdanhRepo.logAudit(
                mataikhoan,
                "INSERT",
                "diemdanh",
                String(newDiemDanh.madiemdanh),
                newDiemDanh,
                request
            );
        }

        return {
            diemdanh: newDiemDanh,
            trangthai: trangThaiDiemDanh,
            tenmon: bh.lichhoc?.phancong?.monhoc?.tenmon ?? "---",
        };
    },

    /** Lấy lịch sử điểm danh của sinh viên (có thể lọc theo học kỳ, tháng, môn) */
    getHistory: async (masv: string, options?: {
        mahocky?: number;
        month?: number;
        year?: number;
        maphancong?: number;
        limit?: number;
    }) => {
        const { data, error } = await diemdanhRepo.getHistory(masv, options);
        if (error) throw new Error(error.message);

        const statusMapping: Record<string, string> = {
            'Comat': 'co_mat',
            'Dimuon': 'muon',
            'Cophep': 'vang_co_phep',
            'Vangmat': 'vang_khong_phep'
        };

        const methodMapping: Record<string, string> = {
            'QR': 'qr',
            'Face': 'khuon_mat',
            'Manual': 'thu_cong'
        };

        return (data ?? []).map((dd: any) => {
            const lh = dd.buoihoc?.lichhoc;
            const pc = lh?.phancong;
            const ngay = new Date(dd.thoigiandiemdanh ?? dd.thoigian);
            return {
                madiemdanh: dd.madiemdanh,
                thoigian: dd.thoigiandiemdanh ?? dd.thoigian,
                trangthai: statusMapping[dd.trangthai] ?? dd.trangthai,
                phuongthuc: methodMapping[dd.phuongthuc] ?? dd.phuongthuc,
                ghichu: dd.ghichu,
                ngayhoc: dd.buoihoc?.ngayhoc ?? null,
                day: String(ngay.getDate()).padStart(2, '0'),
                month: `T${String(ngay.getMonth() + 1).padStart(2, '0')}`,
                timeStr: ngay.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                monhoc: pc?.monhoc ?? null,
                phong: lh?.maphong ?? null,
                giangvien: pc?.giangvien ? {
                    ...pc.giangvien,
                    hoten: [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Chưa rõ"
                } : null,
                hocky: pc?.hocky ?? null,
                maphancong: lh?.maphancong ?? null,
            };
        });
    },

    /** Thống kê điểm danh theo từng môn học */
    getStatsBySubject: async (masv: string, mahocky?: number) => {
        const { data, error } = await diemdanhRepo.getStatsBySubject(masv, mahocky);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /** Lấy buổi học hôm nay của sinh viên (dùng để hiển thị nút điểm danh) */
    getTodaySessions: async (masv: string) => {
        const { data, error } = await diemdanhRepo.getTodaySessions(masv);
        if (error) throw new Error((error as any).message ?? 'Không thể lấy buổi học hôm nay');
        return data ?? [];
    },

    /** Lấy danh sách môn học của SV để lọc */
    getSubjectList: async (masv: string, mahocky?: number) => {
        const { data, error } = await diemdanhRepo.getSubjectList(masv, mahocky);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /** Kiểm tra sinh viên đã điểm danh buổi học này chưa */
    checkExisting: async (masv: string, mabuoihoc: number) => {
        return await diemdanhRepo.checkExisting(masv, mabuoihoc);
    },

    /** Ghi nhận điểm danh (check-in thủ công hoặc khuôn mặt) */
    checkIn: async (masv: string, mabuoihoc: number | null, phuongthuc: PhuongThucDiemDanh, ghichu?: string) => {
        if (!masv) throw new Error('Mã sinh viên không hợp lệ');
        if (!phuongthuc) throw new Error('Phương thức điểm danh không hợp lệ');
        const { data, error } = await diemdanhRepo.checkIn(masv, mabuoihoc, phuongthuc, ghichu);
        if (error) throw new Error(error.message);
        return data;
    },

    /** Tạo QR token điểm danh (sinh ra token, validate và decode) */
    generateQRToken: (mabuoihoc: number): string => {
        if (!mabuoihoc || mabuoihoc <= 0) throw new Error('Mã buổi học không hợp lệ');
        return diemdanhRepo.generateQRToken(mabuoihoc);
    },

    /** Validate QR token quét được */
    validateQRToken: (token: string): { valid: boolean; mabuoihoc?: number; error?: string } => {
        const vr = validateQRToken(token);
        if (!vr.valid) return { valid: false, error: vr.error };
        return diemdanhRepo.validateQRToken(token);
    },

    // ─── Đơn xin nghỉ phép ───────────────────────────────────────────────────

    getLeaveRequests: async (masv: string) => {
        const { data, error } = await diemdanhRepo.getLeaveRequests(masv);
        if (error) throw new Error(error.message);
        return data ?? [];
    },

    getActiveSubjects: async (masv: string) => {
        const { data: svMonHocs, error: errMon } = await diemdanhRepo.getStudentMonHoc(masv);
        if (errMon) throw new Error(errMon.message);
        const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];

        if (maphancongList.length === 0) return [];
        const { data: phanCongs, error: errPc } = await diemdanhRepo.getPhanCongWithLichHoc(maphancongList);
        if (errPc) throw new Error(errPc.message);

        return (phanCongs ?? [])
            .filter((pc: any) => pc.hocky?.danghieuluc)
            .map((pc: any) => ({
                maphancong: pc.maphancong,
                tenmon: pc.monhoc?.tenmon ?? '',
                mamon: pc.monhoc?.mamon ?? '',
                schedules: pc.lichhoc ?? [],
            }));
    },

    submitLeaveRequest: async (masv: string, body: { malichhoc: number; ngayhoc: string; lydo: string; minhchung: string | null }) => {
        const vr = validateLeaveRequest(body);
        if (!vr.valid) throw new Error(vr.error);

        const { malichhoc, ngayhoc, lydo, minhchung } = body;

        const { data: svMonHocs, error: errMon } = await diemdanhRepo.getStudentMonHoc(masv);
        if (errMon) throw new Error(errMon.message);
        const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];

        const { data: lh, error: errLh } = await diemdanhRepo.getLichHocById(malichhoc);
        if (errLh || !lh) throw new Error('Lịch học không tồn tại');
        if (!maphancongList.includes(lh.maphancong)) {
            throw new Error('Bạn không đăng ký môn học này');
        }

        const parts = ngayhoc.split('-');
        const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dow = date.getDay();
        const thutrongtuan = dow === 0 ? 8 : dow + 1;
        if (lh.thutrongtuan !== thutrongtuan) {
            throw new Error('Ngày xin nghỉ không đúng với thứ học của môn học này');
        }

        const { data: buoi } = await diemdanhRepo.findBuoiHoc(malichhoc, ngayhoc);
        let mabuoihoc: number;
        if (buoi) {
            mabuoihoc = buoi.mabuoihoc;
        } else {
            const { data: newBuoi, error: errBuoi } = await diemdanhRepo.createBuoiHoc(malichhoc, ngayhoc);
            if (errBuoi || !newBuoi) throw new Error('Không thể tạo buổi học mới: ' + (errBuoi?.message ?? ''));
            mabuoihoc = newBuoi.mabuoihoc;
        }

        const { data: existDon } = await diemdanhRepo.checkExistingLeave(masv, mabuoihoc);
        if (existDon) throw new Error('Bạn đã nộp đơn xin nghỉ cho buổi học này rồi');

        const { data: newDon, error: errDon } = await diemdanhRepo.insertLeaveRequest({
            masv,
            mabuoihoc,
            lydo,
            minhchung
        });
        if (errDon || !newDon) throw new Error('Lưu đơn xin nghỉ thất bại: ' + (errDon?.message ?? ''));

        return newDon;
    },

    processCheckIn: async (
        masv: string,
        body: {
            method: 'qr' | 'khuon_mat' | 'thu_cong';
            maphancong?: number;
            qrToken?: string;
            mabuoihoc?: number;
            note?: string;
        }
    ) => {
        const TIET_TO_TIME: Record<number, string> = {
            1: '07:00', 2: '07:50', 3: '08:40', 4: '09:30',
            5: '10:20', 6: '11:10', 7: '12:30', 8: '13:20',
            9: '14:10', 10: '15:00', 11: '15:50', 12: '16:40',
            13: '18:00', 14: '18:50', 15: '19:40',
        };

        const { method, maphancong: maphancongParam, qrToken, mabuoihoc: mabuoihocParam, note } = body;

        if (!method || !['qr', 'khuon_mat', 'thu_cong'].includes(method)) {
            throw new Error('Phương thức điểm danh không hợp lệ');
        }

        let maphancong = maphancongParam;
        let finalMabuoihoc = mabuoihocParam ? Number(mabuoihocParam) : null;

        // ── 1. Xử lý điểm danh bằng QR ─────────────────────────────────────────
        if (method === 'qr') {
            if (!qrToken) throw new Error('Thiếu mã QR token');

            const isTeacherQr = qrToken.startsWith('mabuoihoc_') || qrToken.startsWith('qlsv-attendance:');

            if (isTeacherQr) {
                let parsedMabuoihoc = NaN;
                let expectedSecret = qrToken;

                if (qrToken.startsWith('qlsv-attendance:')) {
                    const parts = qrToken.split(':');
                    parsedMabuoihoc = parseInt(parts[1]);
                    expectedSecret = parts[2] || '';
                } else {
                    parsedMabuoihoc = parseInt(qrToken.split('_')[1]);
                }

                if (isNaN(parsedMabuoihoc)) {
                    throw new Error('Mã QR không hợp lệ');
                }

                const { data: buoihoc, error: bhError } = await diemdanhRepo.getBuoiHocWithLichHoc(parsedMabuoihoc);
                if (bhError || !buoihoc) {
                    throw new Error('Không tìm thấy thông tin ca điểm danh này.');
                }

                if (buoihoc.trangthai !== 'DangDiemdanh') {
                    throw new Error('Phiên điểm danh này chưa được kích hoạt hoặc đã đóng lại.');
                }

                if (!buoihoc.qr_secret || buoihoc.qr_secret !== expectedSecret) {
                    throw new Error('Mã QR điểm danh không hợp lệ hoặc đã hết hạn.');
                }

                finalMabuoihoc = parsedMabuoihoc;
                maphancong = (buoihoc.lichhoc as any)?.maphancong;
            } else {
                try {
                    const payload = JSON.parse(Buffer.from(qrToken, 'base64url').toString('utf8'));
                    if (!payload.mabuoihoc) throw new Error('Mã QR không hợp lệ');
                    if (Date.now() > payload.expires) throw new Error('Mã QR đã hết hạn');
                    finalMabuoihoc = Number(payload.mabuoihoc);
                } catch {
                    throw new Error('Mã QR không hợp lệ hoặc sai định dạng');
                }

                if (finalMabuoihoc === null) {
                    throw new Error('Mã QR không hợp lệ hoặc sai định dạng');
                }

                const { data: buoiData } = await diemdanhRepo.getBuoiHocWithLichHoc(finalMabuoihoc);
                if (!buoiData) {
                    throw new Error('Không tìm thấy thông tin buổi học từ QR');
                }
                maphancong = (buoiData as any).lichhoc?.maphancong;
            }
        }

        // ── 2. Xử lý điểm danh khuôn mặt / thủ công (nếu thiếu maphancong) ──────
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const thuTrongTuan = today.getDay() === 0 ? 8 : today.getDay() + 1;

        if (!maphancong) {
            const { data: svMonHocs } = await diemdanhRepo.getStudentMonHoc(masv);
            const maphancongList = svMonHocs?.map((m: any) => m.maphancong) ?? [];

            if (maphancongList.length > 0) {
                const { data: lichhocs } = await diemdanhRepo.getLichHocForChecking(maphancongList, thuTrongTuan);

                const nowMin = today.getHours() * 60 + today.getMinutes();
                let activeLh = null;
                for (const lh of (lichhocs ?? [])) {
                    const startStr = TIET_TO_TIME[lh.tietbatdau] ?? '07:00';
                    const endStr = TIET_TO_TIME[lh.tietketthuc] ?? '11:10';
                    const [sh, sm] = startStr.split(':').map(Number);
                    const [eh, em] = endStr.split(':').map(Number);
                    const startMin = sh * 60 + sm - 30;
                    const endMin = eh * 60 + em + 50 + 30;
                    if (nowMin >= startMin && nowMin <= endMin) {
                        activeLh = lh;
                        break;
                    }
                }

                if (activeLh) {
                    maphancong = activeLh.maphancong;
                    const { data: existBuoi } = await diemdanhRepo.findBuoiHoc(activeLh.malichhoc, todayStr);
                    if (existBuoi) {
                        finalMabuoihoc = existBuoi.mabuoihoc;
                    } else {
                        const { data: newBuoi } = await diemdanhRepo.createBuoiHoc(activeLh.malichhoc, todayStr);
                        finalMabuoihoc = newBuoi?.mabuoihoc ?? null;
                    }
                }
            }
        }

        if (!maphancong) {
            throw new Error('Không tìm thấy môn học nào đang diễn ra hôm nay để điểm danh');
        }

        const { data: hasRegistration } = await diemdanhRepo.checkRegistration(masv, maphancong);
        if (!hasRegistration) {
            throw new Error('Bạn không đăng ký môn học này');
        }

        // ── 3. Xác định trạng thái (Comat / Dimuon) ──────────────────────────
        let trangthai = 'Comat';

        if (method !== 'qr') {
            if (!finalMabuoihoc) {
                const { data: lichhocs } = await diemdanhRepo.getLichHocForChecking([maphancong], thuTrongTuan);
                const lh = lichhocs?.[0];
                if (lh) {
                    const { data: existBuoi } = await diemdanhRepo.findBuoiHoc(lh.malichhoc, todayStr);
                    if (existBuoi) {
                        finalMabuoihoc = existBuoi.mabuoihoc;
                    } else {
                        const { data: newBuoi } = await diemdanhRepo.createBuoiHoc(lh.malichhoc, todayStr);
                        finalMabuoihoc = newBuoi?.mabuoihoc ?? null;
                    }

                    if (lh.tietbatdau) {
                        const startStr = TIET_TO_TIME[lh.tietbatdau] ?? '07:00';
                        const [sh, sm] = startStr.split(':').map(Number);
                        const startDate = new Date(todayStr);
                        startDate.setUTCHours(sh - 7, sm, 0, 0);
                        const diffMin = (Date.now() - startDate.getTime()) / 60000;
                        if (diffMin > 15) trangthai = 'Dimuon';
                    }
                }
            } else {
                const { data: buoi } = await diemdanhRepo.getBuoiHocWithLichHoc(finalMabuoihoc);
                if (buoi && (buoi as any).lichhoc?.tietbatdau) {
                    const startStr = TIET_TO_TIME[(buoi as any).lichhoc.tietbatdau] ?? '07:00';
                    const [sh, sm] = startStr.split(':').map(Number);
                    const startDate = new Date(todayStr);
                    startDate.setUTCHours(sh - 7, sm, 0, 0);
                    const diffMin = (Date.now() - startDate.getTime()) / 60000;
                    if (diffMin > 15) trangthai = 'Dimuon';
                }
            }
        }

        // ── 4. Ghi vào bảng diemdanh nếu có mabuoihoc ───────────────────────────
        if (finalMabuoihoc) {
            const { data: existing } = await diemdanhRepo.checkExisting(masv, finalMabuoihoc);

            if (existing && ['Comat', 'Dimuon', 'Cophep'].includes(existing.trangthai)) {
                return {
                    alreadyCheckedIn: true,
                    existing,
                };
            }

            const methodMapping: Record<string, string> = {
                qr: 'QR',
                khuon_mat: 'Face',
                thu_cong: 'Manual'
            };
            const dbMethod = methodMapping[method] ?? 'Manual';
            const ghichu = note ?? (method === 'khuon_mat' ? 'Xác thực khuôn mặt' : method === 'qr' ? 'Quét mã QR' : 'Thủ công');
            const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().replace("Z", "");

            let dd;
            if (existing) {
                const { data, error } = await diemdanhRepo.updateAttendanceRecord(existing.madiemdanh, {
                    thoigiandiemdanh: vnNow,
                    trangthai,
                    phuongthuc: dbMethod,
                    ghichu,
                });
                if (error) throw error;
                dd = data;
            } else {
                const { data, error } = await diemdanhRepo.insertAttendanceRecord({
                    masv,
                    mabuoihoc: finalMabuoihoc,
                    thoigiandiemdanh: vnNow,
                    trangthai,
                    phuongthuc: dbMethod,
                    ghichu,
                    ngaytao: vnNow,
                });
                if (error) throw error;
                dd = data;
            }

            return {
                success: true,
                trangthai,
                data: dd,
            };
        }

        throw new Error('Không tìm thấy hoặc không thể tạo buổi học để ghi nhận điểm danh');
    },

    getBuoiHoc: async (mabuoihoc: number) => {
        const { data, error } = await diemdanhRepo.getBuoiHoc(mabuoihoc);
        if (error) throw new Error(error.message);
        return data;
    },
};
