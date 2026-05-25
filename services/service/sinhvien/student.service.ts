// services/service/sinhvien/student.service.ts
// Service Layer - chứa logic nghiệp vụ, gọi validate rồi gọi studentRepo.
// KHÔNG truy cập trực tiếp Supabase/database tại đây.

import { studentRepo, UpdateProfileDto } from '@/services/repositories/sinhvien/student.repo';
import {
    validateUpdateProfile,
    validateSubmitAssignment,
    validateFaceEmbedding,
} from '@/lib/validation/sinhvien';

export const sinhVienService = {

    // ─── Hồ sơ cá nhân ───────────────────────────────────────────────────────

    async getMyProfile(mataikhoan: string) {
        const { data, error } = await studentRepo.getProfileByAccount(mataikhoan);
        if (error) throw error;
        if (!data) throw new Error('Không tìm thấy hồ sơ sinh viên');

        const hoten = `${data.hodem || ''} ${data.ten || ''}`.trim() || 'Sinh viên';
        return {
            ...data,
            hoten,
            chitietsinhvien: {
                quequan: data.quequan,
                diachi: data.diachi,
                sodienthoai: data.sodienthoai,
                emailcanhan: data.emailcanhan,
                tenphuhuynh: data.tenphuhuynh,
                sodienthoaiphuhuynh: data.sodienthoaiphuhuynh,
                cccd: data.cccd,
                ngaycapcccd: data.ngaycapcccd,
                noicapcccd: data.noicapcccd,
                dantoc: data.dantoc,
                tongiao: data.tongiao,
            },
            lop: {
                tenlop: data.malop || '—',
                nganh: 'Công nghệ thông tin',
                khoahoc: 'K68',
            },
        };
    },

    /** Cập nhật thông tin hồ sơ sinh viên */
    async updateProfile(mataikhoan: string, body: Record<string, unknown>) {
        // Validate trước
        const vr = validateUpdateProfile(body);
        if (!vr.valid) throw new Error(vr.error);

        const dto: UpdateProfileDto = {};

        if ('hoten' in body && body.hoten !== undefined && body.hoten !== null) {
            const nameStr = String(body.hoten).trim();
            const parts = nameStr.split(/\s+/);
            dto.ten = parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? null);
            dto.hodem = parts.length > 1 ? parts.slice(0, -1).join(' ') : null;
        }

        // Normalize giới tính
        const gt = body.gioitinh as string | undefined;
        if (gt !== undefined) {
            if (gt === 'Nữ') dto.gioitinh = 'Nu';
            else if (gt === 'Khác') dto.gioitinh = 'Khac';
            else if (gt === 'Nam' || gt === 'Nu' || gt === 'Khac') dto.gioitinh = gt;
            else dto.gioitinh = null;
        }

        if ('ngaysinh' in body) dto.ngaysinh = (body.ngaysinh as string | null) ?? null;
        if ('anhdaidien' in body) dto.anhdaidien = ((body.anhdaidien as string)?.trim()) || null;
        if ('quequan' in body) dto.quequan = ((body.quequan as string)?.trim()) || null;
        if ('diachi' in body) dto.diachi = ((body.diachi as string)?.trim()) || null;
        if ('sodienthoai' in body) dto.sodienthoai = ((body.sodienthoai as string)?.trim()) || null;
        if ('emailcanhan' in body) dto.emailcanhan = ((body.emailcanhan as string)?.trim()) || null;
        if ('tenphuhuynh' in body) dto.tenphuhuynh = ((body.tenphuhuynh as string)?.trim()) || null;
        if ('sodienthoaiphuhuynh' in body) dto.sodienthoaiphuhuynh = ((body.sodienthoaiphuhuynh as string)?.trim()) || null;
        if ('cccd' in body) dto.cccd = ((body.cccd as string)?.trim()) || null;
        if ('ngaycapcccd' in body) dto.ngaycapcccd = (body.ngaycapcccd as string | null) ?? null;
        if ('noicapcccd' in body) dto.noicapcccd = ((body.noicapcccd as string)?.trim()) || null;
        if ('dantoc' in body) dto.dantoc = ((body.dantoc as string)?.trim()) || null;
        if ('tongiao' in body) dto.tongiao = ((body.tongiao as string)?.trim()) || null;

        if ('face_embedding' in body && body.face_embedding !== undefined) {
            const vfe = validateFaceEmbedding(body.face_embedding);
            if (!vfe.valid) throw new Error(vfe.error);
            dto.face_embedding = body.face_embedding as number[];
        }

        const { error } = await studentRepo.updateProfile(mataikhoan, dto);
        if (error) throw error;
        return { success: true };
    },

    async getBasicInfo(mataikhoan: string) {
        const { data: sv, error } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (error || !sv) throw new Error('Không tìm thấy sinh viên');
        return sv;
    },

    // ─── Tổng quan Dashboard ──────────────────────────────────────────────────

    async getDashboardData(mataikhoan: string) {
        const { data: sv, error } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (error || !sv) throw new Error('Không tìm thấy sinh viên');

        const hoten = `${sv.hodem || ''} ${sv.ten || ''}`.trim() || 'Sinh viên';

        const [report, stats, lichHomNay, thongBao] = await Promise.all([
            sinhVienService.getStudentGradesReport(mataikhoan, "all"),
            sinhVienService.getDashboardStats(sv.masv),
            sinhVienService.getTodaySchedule(sv.masv),
            sinhVienService.getNotifications(sv.masv, sv.malop)
        ]);

        const gpaView = report.gpaView;
        const diemGanDay = (report.grades ?? []).slice(0, 6).map((g: any) => {
            const cc = g.diemThanhPhan.find((dt: any) => dt.loai === "ChuyenCan")?.giatri;
            const gk = g.diemThanhPhan.find((dt: any) => dt.loai === "GiuaKy")?.giatri;
            const ck = g.diemThanhPhan.find((dt: any) => dt.loai === "CuoiKy")?.giatri;
            return {
                tenmon: g.tenmon,
                chuyencan: cc !== undefined && cc !== null ? cc : "—",
                giuaky: gk !== undefined && gk !== null ? gk : "—",
                cuoiky: ck !== undefined && ck !== null ? ck : "—",
                tongket: g.diem10 !== null && g.diem10 !== undefined ? g.diem10 : "—"
            };
        });

        return {
            hoten,
            masv: sv.masv,
            monHocCount: stats.monHocCount,
            gpa10_hocky_hientai: gpaView?.gpa10_hocky_hientai ?? 0,
            gpa4_hocky_hientai: gpaView?.gpa4_hocky_hientai ?? 0,
            gpa10_tich_luy: gpaView?.gpa10_tich_luy ?? 0,
            gpa4_tich_luy: gpaView?.gpa4_tich_luy ?? 0,
            xep_loai_hoc_luc: gpaView?.xep_loai_hoc_luc ?? null,
            soBuoiVang: stats.soBuoiVang,
            soBaiTapConHan: stats.soBaiTapConHan,
            lichHocHomNay: lichHomNay,
            thongBaoGanDay: (thongBao ?? []).slice(0, 5),
            diemGanDay
        };
    },

    async getDashboardStats(masv: string) {
        const [
            { data: svMonHoc },
            { data: diemRows },
            { data: diemDanh },
        ] = await Promise.all([
            studentRepo.getMonHocDangHoc(masv),
            studentRepo.getDiemGanDay(masv, 6),
            studentRepo.getDemVangMat(masv),
        ]);

        // Tính GPA từ điểm cuối kỳ
        let diemTBHK: number | null = null;
        if (diemRows && diemRows.length > 0) {
            const cuoiky = diemRows.filter((d) => d.loaidiem === 'CuoiKy');
            if (cuoiky.length > 0) {
                diemTBHK = parseFloat(
                    (cuoiky.reduce((s, d) => s + d.giatri, 0) / cuoiky.length).toFixed(2)
                );
            }
        }

        // Đếm bài tập chưa nộp
        const myAssignments = (svMonHoc ?? []).map((m) => m.maphancong);
        let soBaiTapConHan = 0;
        if (myAssignments.length > 0) {
            const { data: allBT } = await studentRepo.getBaiTapTheoMonHoc(myAssignments);
            if (allBT && allBT.length > 0) {
                const maBTs = allBT.map((b) => b.mabaitap);
                const { data: submittedBT } = await studentRepo.getBaiDaNop(masv, maBTs);
                const submittedIDs = new Set((submittedBT ?? []).map((s) => s.mabaitap));
                soBaiTapConHan = allBT.filter((b) => !submittedIDs.has(b.mabaitap)).length;
            }
        }

        return {
            monHocCount: svMonHoc?.length ?? 0,
            diemTBHK,
            soBuoiVang: diemDanh?.length ?? 0,
            soBaiTapConHan,
            diemGanDay: diemRows ?? [],
        };
    },

    // ─── Lịch học hôm nay ─────────────────────────────────────────────────────

    async getTodaySchedule(masv: string) {
        const jsDay = new Date().getDay();
        const dbDay = jsDay === 0 ? 8 : jsDay + 1;
        const { data, error } = await studentRepo.getLichHocHomNay(masv, dbDay);
        if (error) throw error;
        return data ?? [];
    },

    // ─── Lịch học đầy đủ cả tuần ──────────────────────────────────────────────

    async getFullSchedule(masv: string) {
        const { data: svMonHoc } = await studentRepo.getMonHocDangHoc(masv);
        if (!svMonHoc || svMonHoc.length === 0) return [];
        const maPCs = svMonHoc.map((m) => m.maphancong);
        const { data, error } = await studentRepo.getLichHocCaTuan(maPCs);
        if (error) throw error;
        return data ?? [];
    },

    // ─── Bảng điểm ────────────────────────────────────────────────────────────

    async getGrades(masv: string) {
        const { data, error } = await studentRepo.getDiemChiTiet(masv);
        if (error) throw error;
        return data ?? [];
    },

    async getGradeSummary(masv: string) {
        const { data, error } = await studentRepo.getDiemTongKet(masv);
        if (error) throw error;
        return data ?? [];
    },

    async getStudentGradesReport(mataikhoan: string, mahockyParam: string | null) {
        const isAll = !mahockyParam || mahockyParam === "all";

        // 1. Lấy profile/masv
        const { data: sv, error: svError } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (svError || !sv) throw new Error("Không tìm thấy sinh viên.");
        const masv = sv.masv;

        // 2. Fetch profile đầy đủ để lấy email, lớp (để tương thích hoàn toàn)
        const { data: svFullData } = await studentRepo.getProfileByAccount(mataikhoan);
        const hoten = svFullData
            ? `${svFullData.hodem || ''} ${svFullData.ten || ''}`.trim() || 'Sinh viên'
            : "Sinh Viên";
        const emailtruong = svFullData?.emailtruong ?? "";
        const malop = svFullData?.malop ?? "";
        const tenlop = svFullData?.malop ?? "";

        // 3. Tính toán điểm tổng kết
        const { data: allDiemTongKet } = await studentRepo.getDiemTongKetRaw(masv);
        const pcIds = (allDiemTongKet ?? []).map(dt => dt.maphancong);

        let diemMoinhat: any[] = [];
        if (pcIds.length > 0) {
            const { data: allPhanCong } = await studentRepo.getPhanCongWithMonHocAndHocKy(pcIds);
            const rawList = (allDiemTongKet ?? []).map(dt => {
                const pc = (allPhanCong ?? []).find(p => p.maphancong === dt.maphancong);
                if (!pc) return null;
                return {
                    mamon: pc.mamon,
                    mahocky: pc.mahocky,
                    sotinchi: (pc.monhoc as any)?.sotinchi ?? 0,
                    diemtongket: dt.diemtongket !== null ? Number(dt.diemtongket) : null,
                    ketqua: dt.ketqua,
                    la_hocky_hientai: (pc.hocky as any)?.danghieuluc ?? false
                };
            }).filter(Boolean);

            const mapMoinhat: Record<string, any> = {};
            rawList.forEach(item => {
                if (!item || item.diemtongket === null) return;
                if (item.ketqua !== "Dat" && item.ketqua !== "KhongDat") return;

                const existing = mapMoinhat[item.mamon];
                if (!existing || item.mahocky > existing.mahocky) {
                    mapMoinhat[item.mamon] = item;
                }
            });
            diemMoinhat = Object.values(mapMoinhat);
        }

        const tinhDiemHe4 = (d: number) => {
            if (d >= 9.5) return 4.0;
            if (d >= 8.5) return 3.7;
            if (d >= 7.8) return 3.3;
            if (d >= 7.0) return 3.0;
            if (d >= 6.3) return 2.5;
            if (d >= 5.5) return 2.0;
            if (d >= 4.8) return 1.5;
            if (d >= 4.0) return 1.0;
            return 0.0;
        };

        let gpa10_hocky_hientai = 0;
        let gpa4_hocky_hientai = 0;
        let sotinchi_hocky_hientai = 0;
        let sotinchi_dat_hocky_hientai = 0;

        let gpa10_tich_luy = 0;
        let gpa4_tich_luy = 0;
        let tong_sotinchi_da_hoc = 0;
        let sotinchi_tich_luy_dat = 0;

        const listKHT = diemMoinhat.filter(d => d.la_hocky_hientai);
        if (listKHT.length > 0) {
            let sumD10 = 0;
            let sumD4 = 0;
            let sumTC = 0;
            listKHT.forEach(d => {
                sumD10 += d.diemtongket * d.sotinchi;
                sumD4 += tinhDiemHe4(d.diemtongket) * d.sotinchi;
                sumTC += d.sotinchi;
                if (d.ketqua === "Dat") {
                    sotinchi_dat_hocky_hientai += d.sotinchi;
                }
            });
            if (sumTC > 0) {
                gpa10_hocky_hientai = sumD10 / sumTC;
                gpa4_hocky_hientai = sumD4 / sumTC;
                sotinchi_hocky_hientai = sumTC;
            }
        }

        if (diemMoinhat.length > 0) {
            let sumD10 = 0;
            let sumD4 = 0;
            let sumTC = 0;
            diemMoinhat.forEach(d => {
                sumD10 += d.diemtongket * d.sotinchi;
                sumD4 += tinhDiemHe4(d.diemtongket) * d.sotinchi;
                sumTC += d.sotinchi;
                if (d.ketqua === "Dat") {
                    sotinchi_tich_luy_dat += d.sotinchi;
                }
            });
            if (sumTC > 0) {
                gpa10_tich_luy = sumD10 / sumTC;
                gpa4_tich_luy = sumD4 / sumTC;
                tong_sotinchi_da_hoc = sumTC;
            }
        }

        const getXepLoai10 = (gpa: number) => {
            if (gpa >= 9.0) return "Xuất sắc";
            if (gpa >= 8.0) return "Giỏi";
            if (gpa >= 7.0) return "Khá";
            if (gpa >= 5.0) return "Trung bình";
            if (gpa >= 4.0) return "Yếu";
            return "Kém";
        };

        const getXepLoai4 = (gpa: number) => {
            if (gpa >= 3.6) return "Xuất sắc";
            if (gpa >= 3.2) return "Giỏi";
            if (gpa >= 2.5) return "Khá";
            if (gpa >= 2.0) return "Trung bình";
            if (gpa >= 1.0) return "Yếu";
            return "Kém";
        };

        const xep_loai_hoc_luc = tong_sotinchi_da_hoc > 0 ? getXepLoai10(gpa10_tich_luy) : null;
        const xep_loai_hoc_luc_he4 = tong_sotinchi_da_hoc > 0 ? getXepLoai4(gpa4_tich_luy) : null;

        const gpaView = {
            masv,
            hoten,
            emailtruong,
            malop,
            tenlop,
            gpa10_hocky_hientai,
            gpa4_hocky_hientai,
            sotinchi_hocky_hientai,
            sotinchi_dat_hocky_hientai,
            gpa10_tich_luy,
            gpa4_tich_luy,
            tong_sotinchi_da_hoc,
            sotinchi_tich_luy_dat,
            xep_loai_hoc_luc,
            xep_loai_hoc_luc_he4
        };

        // 4. Danh sách học kỳ
        const { data: dsHocKy } = await studentRepo.getHocKyList();
        const hocKyList = dsHocKy ?? [];
        const mahocky = isAll ? null : Number(mahockyParam);
        const hocKyHienTai = mahocky
            ? (hocKyList.find((hk) => hk.mahocky === mahocky) ?? null)
            : null;

        // 5. Bảng điểm chi tiết
        const { data: rawEnrolled } = await studentRepo.getMonHocDangHoc(masv);
        const { data: rawTongKet } = await studentRepo.getDiemTongKetRaw(masv);

        const tongKetMap: Record<number, any> = {};
        const allMaphancong = new Set<number>();

        (rawEnrolled ?? []).forEach((r) => allMaphancong.add(r.maphancong));
        (rawTongKet ?? []).forEach((tk) => {
            allMaphancong.add(tk.maphancong);
            tongKetMap[tk.maphancong] = tk;
        });

        const maphancongList = Array.from(allMaphancong);

        if (maphancongList.length === 0) {
            return {
                hocKyList,
                mahocky,
                hocKy: hocKyHienTai,
                grades: [],
                gpaView: gpaView ?? null,
            };
        }

        const { data: phancongData } = await studentRepo.getPhanCongWithGiangVien(maphancongList);
        let filteredPhancong = phancongData ?? [];
        if (!isAll && mahocky) {
            filteredPhancong = filteredPhancong.filter((pc) => pc.mahocky === mahocky);
        }

        const filteredPcIds = filteredPhancong.map((pc) => pc.maphancong);
        const { data: rawDiem } = filteredPcIds.length > 0
            ? await studentRepo.getDiemThanhPhan(masv, filteredPcIds)
            : { data: [] };

        const diemThanhPhanMap: Record<number, { loai: string; giatri: number; heso: number }[]> = {};
        (rawDiem ?? []).forEach((d) => {
            if (!diemThanhPhanMap[d.maphancong]) diemThanhPhanMap[d.maphancong] = [];
            diemThanhPhanMap[d.maphancong].push({ loai: d.loaidiem, giatri: d.giatri, heso: d.heso });
        });

        const grades = filteredPhancong.map((pc: any, idx: number) => {
            const mon = pc.monhoc;
            const tk = tongKetMap[pc.maphancong] ?? null;
            const diem10 = tk?.diemtongket !== null && tk?.diemtongket !== undefined
                ? Number(tk.diemtongket) : null;
            const diemChu = tk?.diemchu ?? null;
            const ketQua = tk?.ketqua ?? null;

            return {
                stt: idx + 1,
                mamon: pc.mamon ?? "---",
                malophoc: pc.malophoc ?? "---",
                mahocky: pc.mahocky,
                tenmon: mon?.tenmon ?? "Chưa có tên môn",
                sotinchi: mon?.sotinchi ?? 0,
                giangvien: pc.giangvien
                    ? [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "---"
                    : "---",
                diem10,
                diemchu: diemChu,
                ketqua: ketQua,
                dat: ketQua === "Dat",
                coDiem: diem10 !== null,
                diemThanhPhan: diemThanhPhanMap[pc.maphancong] ?? [],
            };
        });

        return {
            hocKyList,
            mahocky,
            hocKy: hocKyHienTai,
            grades,
            gpaView: gpaView ?? null,
        };
    },

    // ─── Bài tập & Nộp bài ────────────────────────────────────────────────────

    async getAssignments(masv: string) {
        const { data: svMonHoc } = await studentRepo.getMonHocDangHoc(masv);
        if (!svMonHoc || svMonHoc.length === 0) return [];
        const maPCs = svMonHoc.map((m) => m.maphancong);
        const { data, error } = await studentRepo.getBaiTapDayDu(maPCs);
        if (error) throw error;

        // Lấy bài nộp của SV
        const maBTs = (data ?? []).map((b) => b.mabaitap);
        let nopBaiMap: Record<number, unknown> = {};
        if (maBTs.length > 0) {
            const { data: nopBaiRows } = await studentRepo.getNopBaiTheoMaBT(masv, maBTs);
            if (nopBaiRows) {
                for (const nb of nopBaiRows) nopBaiMap[nb.mabaitap] = nb;
            }
        }

        const mapped = (data ?? []).map((bt: any) => {
            const pc = bt.phancong;
            if (pc && pc.giangvien) {
                pc.giangvien = {
                    ...pc.giangvien,
                    hoten: [pc.giangvien.hodem, pc.giangvien.ten].filter(Boolean).join(" ") || "Giảng viên"
                };
            }
            return {
                ...bt,
                phancong: pc,
                nopbai: nopBaiMap[bt.mabaitap] ?? null
            };
        });

        // Sắp xếp: bài tập còn hạn trước (hạn nộp gần nhất xếp trước - ascending),
        // bài tập đã hết hạn sau (hết hạn gần nhất xếp trước - descending)
        const now = new Date();
        const active = mapped.filter((item) => new Date(item.hannop) >= now);
        const expired = mapped.filter((item) => new Date(item.hannop) < now);

        active.sort((a, b) => new Date(a.hannop).getTime() - new Date(b.hannop).getTime());
        expired.sort((a, b) => new Date(b.hannop).getTime() - new Date(a.hannop).getTime());

        return [...active, ...expired];
    },

    async submitAssignment(masv: string, mabaitap: number, noidungnop: string | null, filenop: string | null) {
        // Validate
        const vr = validateSubmitAssignment({ mabaitap, noidungnop, filenop });
        if (!vr.valid) throw new Error(vr.error);

        // Kiểm tra bài tập tồn tại
        const { data: baitap, error: btErr } = await studentRepo.getBaiTapById(mabaitap);
        if (btErr || !baitap) throw new Error('Bài tập không tồn tại.');

        const now = new Date();
        const hannop = new Date(baitap.hannop);
        if (now > hannop) {
            throw new Error("Bài tập đã quá hạn nộp, không thể nộp bài.");
        }
        const trenop = false;

        // Kiểm tra đã nộp chưa
        const { data: existing } = await studentRepo.checkNopBai(masv, mabaitap);

        if (existing) {
            const { error } = await studentRepo.updateNopBai(existing.manopbai, {
                noidungnop,
                filenop,
                thoigiannop: now.toISOString(),
                trenop,
            });
            if (error) throw error;
            return { updated: true, trenop };
        } else {
            const { error } = await studentRepo.insertNopBai({
                mabaitap,
                masv,
                noidungnop,
                filenop,
                thoigiannop: now.toISOString(),
                trenop,
            });
            if (error) throw error;
            return { updated: false, trenop };
        }
    },

    async getMySubmissions(masv: string) {
        const { data, error } = await studentRepo.getMySubmissions(masv);
        if (error) throw error;
        return data ?? [];
    },


    // ─── Thông báo ─────────────────────────────────────────────────────────────

    async getNotifications(masv: string, malop: string | null) {
        const { data: svMonHoc } = await studentRepo.getMonHocDangHoc(masv);
        const myAssignments = (svMonHoc ?? []).map((m) => m.maphancong);

        const conditions = [
            'doituong.eq.Tatca',
            `and(doituong.eq.SinhVien,or(malop.is.null,malop.eq.${malop || 'NONE'}))`,
        ];
        if (myAssignments.length > 0) {
            conditions.push(`and(doituong.neq.GiangVien,maphancong.in.(${myAssignments.join(',')}))`);
        }

        const { data: thongBao, error } = await studentRepo.getThongBao(conditions);
        if (error) throw error;

        const mathongbaoIds = (thongBao ?? []).map((t) => t.mathongbao);
        let readMap: Record<number, boolean> = {};
        if (mathongbaoIds.length > 0) {
            const { data: readRows } = await studentRepo.getDaDocThongBao(masv, mathongbaoIds);
            if (readRows) {
                for (const r of readRows) readMap[r.mathongbao] = r.dadoc;
            }
        }

        return (thongBao ?? []).map((tb) => ({ ...tb, dadoc: readMap[tb.mathongbao] ?? false }));
    },

    async markNotificationRead(masv: string, mathongbao: number) {
        const now = new Date().toISOString();
        const { data: existing } = await studentRepo.checkDaDoc(masv, mathongbao);
        if (existing) {
            const { error } = await studentRepo.updateDaDoc(masv, mathongbao, now);
            if (error) throw error;
        } else {
            const { error } = await studentRepo.insertDaDoc(masv, mathongbao, now);
            if (error) throw error;
        }
        return true;
    },

    // ─── Lịch sử điểm danh ────────────────────────────────────────────────────

    async getAttendanceHistory(masv: string) {
        const { data, error } = await studentRepo.getLichSuDiemDanh(masv);
        if (error) throw error;
        return data ?? [];
    },

    async getAssignmentsByAccount(mataikhoan: string) {
        const { data: sv, error } = await studentRepo.getBasicInfoByAccount(mataikhoan);
        if (error || !sv) throw new Error('Không tìm thấy sinh viên');
        return this.getAssignments(sv.masv);
    },

    async uploadFile(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `messages/${fileName}`; // Keep matching path structure from original api route

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await studentRepo.uploadFile(filePath, buffer, file.type);
        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = await studentRepo.getPublicUrl(filePath);

        return {
            url: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
        };
    },
};
