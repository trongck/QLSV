import { GioiTinh, TrangThaiSinhVien, TrangThaiTaiKhoan, LoaiThongBao, DoiTuongThongBao } from "@/types";

export interface ValidationError {
    field: string;   // tên field bị lỗi (dùng để highlight input nếu cần)
    message: string; // thông báo hiển thị cho người dùng
}

// ─── Helpers nội bộ ───────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9\s\-+().]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function required(value: unknown, field: string, label: string): ValidationError | null {
    if (value === undefined || value === null) return null; // partial update → bỏ qua
    const str = String(value).trim();
    if (!str) return { field, message: `${label} không được để trống.` };
    return null;
}

function maxLen(value: unknown, field: string, label: string, max: number): ValidationError | null {
    if (value === undefined || value === null) return null;
    if (String(value).trim().length > max)
        return { field, message: `${label} không được vượt quá ${max} ký tự.` };
    return null;
}

function email(value: unknown, field: string, label: string): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null; // để required() xử lý nếu bắt buộc
    if (!EMAIL_RE.test(str)) return { field, message: `${label} không đúng định dạng email.` };
    return null;
}

function phone(value: unknown, field: string): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (!PHONE_RE.test(str)) return { field, message: "Số điện thoại không hợp lệ." };
    return null;
}

function date(value: unknown, field: string, label: string, allowFuture = false): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (!DATE_RE.test(str)) return { field, message: `${label} phải có định dạng YYYY-MM-DD.` };
    const d = new Date(str);
    if (isNaN(d.getTime())) return { field, message: `${label} không phải ngày hợp lệ.` };
    if (!allowFuture && d > new Date()) return { field, message: `${label} không thể là ngày trong tương lai.` };
    return null;
}

function minLen(value: unknown, field: string, label: string, min: number): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (str.length < min) return { field, message: `${label} phải có ít nhất ${min} ký tự.` };
    return null;
}

function collect(...errs: (ValidationError | null)[]): ValidationError[] {
    return errs.filter((e): e is ValidationError => e !== null);
}

// ─── Khoa ─────────────────────────────────────────────────────────────────────

export interface KhoaPayload {
    makhoa?: string;
    tenkhoa?: string;
    dienthoai?: string;
    email?: string;
}

export function validateKhoa(data: KhoaPayload, isCreate = true): ValidationError[] {
    const errs: (ValidationError | null)[] = [];

    if (isCreate) {
        errs.push(required(data.makhoa, "makhoa", "Mã khoa"));
        errs.push(required(data.tenkhoa, "tenkhoa", "Tên khoa"));
    }

    errs.push(maxLen(data.makhoa, "makhoa", "Mã khoa", 20));
    errs.push(maxLen(data.tenkhoa, "tenkhoa", "Tên khoa", 150));
    errs.push(phone(data.dienthoai, "dienthoai"));
    errs.push(email(data.email, "email", "Email khoa"));
    errs.push(maxLen(data.email, "email", "Email", 100));

    return collect(...errs);
}

// ─── Lớp ──────────────────────────────────────────────────────────────────────

export interface LopPayload {
    malop?: string;
    tenlop?: string;
    makhoa?: string;
    nganh?: string;
    khoahoc?: string;
    magv?: string;
}

export function validateLop(data: LopPayload, isCreate = true): ValidationError[] {
    const errs: (ValidationError | null)[] = [];

    if (isCreate) {
        errs.push(required(data.malop, "malop", "Mã lớp"));
        errs.push(required(data.tenlop, "tenlop", "Tên lớp"));
    }

    errs.push(maxLen(data.malop, "malop", "Mã lớp", 20));
    errs.push(maxLen(data.tenlop, "tenlop", "Tên lớp", 150));
    errs.push(maxLen(data.nganh, "nganh", "Ngành học", 100));
    errs.push(maxLen(data.khoahoc, "khoahoc", "Khoá học", 20));
    errs.push(maxLen(data.magv, "magv", "Mã GVCN", 20));

    if (data.khoahoc) {
        const ok = /^\d{4}-\d{4}$/.test(String(data.khoahoc).trim());
        if (!ok && String(data.khoahoc).trim())
            errs.push({ field: "khoahoc", message: "Khoá học phải có định dạng YYYY-YYYY (VD: 2022-2026)." });
    }

    return collect(...errs);
}

// ─── Sinh viên ────────────────────────────────────────────────────────────────

export interface SinhVienCreatePayload {
    masv?: string;
    malop?: string;
    hoten?: string;
    ngaysinh?: string;
    gioitinh?: string;
    emailtruong?: string;
    email?: string;
    matkhau?: string;
}

export interface SinhVienUpdatePayload {
    hoten?: string;
    malop?: string;
    ngaysinh?: string;
    gioitinh?: string;
    emailtruong?: string;
    trangthai?: string;
}

const VALID_GIOITINH = Object.values(GioiTinh) as string[];
const VALID_TRANGTHAI_SV = Object.values(TrangThaiSinhVien) as string[];

function gioitinh(value: unknown, field = "gioitinh"): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (!VALID_GIOITINH.includes(str))
        return { field, message: "Giới tính không hợp lệ." };
    return null;
}

export function validateSinhVienCreate(data: SinhVienCreatePayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.masv, "masv", "MSSV"),
        required(data.malop, "malop", "Lớp"),
        required(data.hoten, "hoten", "Họ và tên"),
        required(data.email, "email", "Email đăng nhập"),
        required(data.matkhau, "matkhau", "Mật khẩu"),

        maxLen(data.masv, "masv", "MSSV", 20),
        maxLen(data.hoten, "hoten", "Họ và tên", 100),
        email(data.emailtruong, "emailtruong", "Email trường"),
        email(data.email, "email", "Email đăng nhập"),
        minLen(data.matkhau, "matkhau", "Mật khẩu", 6),
        maxLen(data.matkhau, "matkhau", "Mật khẩu", 72),
        date(data.ngaysinh, "ngaysinh", "Ngày sinh"),
        gioitinh(data.gioitinh),
    ];
    return collect(...errs);
}

export function validateSinhVienUpdate(data: SinhVienUpdatePayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.hoten, "hoten", "Họ và tên"),
        maxLen(data.hoten, "hoten", "Họ và tên", 100),
        email(data.emailtruong, "emailtruong", "Email trường"),
        date(data.ngaysinh, "ngaysinh", "Ngày sinh"),
        gioitinh(data.gioitinh),
    ];

    if (data.trangthai !== undefined && !VALID_TRANGTHAI_SV.includes(String(data.trangthai)))
        errs.push({ field: "trangthai", message: "Trạng thái sinh viên không hợp lệ." });

    return collect(...errs);
}

// ─── Giảng viên ───────────────────────────────────────────────────────────────

const VALID_HOCVI = ["Cử nhân", "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"];

export interface GiangVienCreatePayload {
    magv?: string;
    makhoa?: string;
    hoten?: string;
    ngaysinh?: string;
    gioitinh?: string;
    hocvi?: string;
    chuyennganh?: string;
    emailtruong?: string;
    email?: string;
    matkhau?: string;
}

export interface GiangVienUpdatePayload {
    hoten?: string;
    makhoa?: string;
    ngaysinh?: string;
    gioitinh?: string;
    hocvi?: string;
    chuyennganh?: string;
    emailtruong?: string;
}

function hocvi(value: unknown, field = "hocvi"): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (!VALID_HOCVI.includes(str))
        return { field, message: "Học vị không hợp lệ." };
    return null;
}

export function validateGiangVienCreate(data: GiangVienCreatePayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.magv, "magv", "Mã giảng viên"),
        required(data.hoten, "hoten", "Họ và tên"),
        required(data.email, "email", "Email đăng nhập"),
        required(data.matkhau, "matkhau", "Mật khẩu"),

        maxLen(data.magv, "magv", "Mã giảng viên", 20),
        maxLen(data.hoten, "hoten", "Họ và tên", 100),
        maxLen(data.chuyennganh, "chuyennganh", "Chuyên ngành", 100),
        email(data.emailtruong, "emailtruong", "Email trường"),
        email(data.email, "email", "Email đăng nhập"),
        minLen(data.matkhau, "matkhau", "Mật khẩu", 6),
        maxLen(data.matkhau, "matkhau", "Mật khẩu", 72),
        date(data.ngaysinh, "ngaysinh", "Ngày sinh"),
        gioitinh(data.gioitinh),
        hocvi(data.hocvi),
    ];
    return collect(...errs);
}

export function validateGiangVienUpdate(data: GiangVienUpdatePayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.hoten, "hoten", "Họ và tên"),
        maxLen(data.hoten, "hoten", "Họ và tên", 100),
        maxLen(data.chuyennganh, "chuyennganh", "Chuyên ngành", 100),
        email(data.emailtruong, "emailtruong", "Email trường"),
        date(data.ngaysinh, "ngaysinh", "Ngày sinh"),
        gioitinh(data.gioitinh),
        hocvi(data.hocvi),
    ];
    return collect(...errs);
}

// ─── Tài khoản ────────────────────────────────────────────────────────────────

const VALID_TRANGTHAI_TK = Object.values(TrangThaiTaiKhoan) as string[];

export interface TaiKhoanUpdatePayload {
    trangthai?: string;
    matkhau?: string;
}

export function validateTaiKhoanUpdate(data: TaiKhoanUpdatePayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [];

    if (data.trangthai !== undefined && !VALID_TRANGTHAI_TK.includes(String(data.trangthai)))
        errs.push({ field: "trangthai", message: "Trạng thái tài khoản không hợp lệ." });

    if (data.matkhau !== undefined && String(data.matkhau).trim()) {
        errs.push(minLen(data.matkhau, "matkhau", "Mật khẩu mới", 6));
        errs.push(maxLen(data.matkhau, "matkhau", "Mật khẩu mới", 72));
    }

    return collect(...errs);
}

// ─── Học kỳ ──────────────────────────────────────────────────────────────────

export interface HocKyPayload {
    tenhocky?: string;
    namhoc?: number | string;
    ky?: number | string;
    ngaybatdau?: string;
    ngayketthuc?: string;
    danghieuluc?: boolean;
}

export function validateHocKy(data: HocKyPayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.tenhocky, "tenhocky", "Tên học kỳ"),
        maxLen(data.tenhocky, "tenhocky", "Tên học kỳ", 100),
    ];

    if (data.namhoc === undefined || data.namhoc === null || String(data.namhoc).trim() === "") {
        errs.push({ field: "namhoc", message: "Năm học không được để trống." });
    } else {
        const n = Number(data.namhoc);
        if (isNaN(n) || n < 2000 || n > 2100) {
            errs.push({ field: "namhoc", message: "Năm học không hợp lệ (phải từ 2000 đến 2100)." });
        }
    }

    if (data.ky === undefined || data.ky === null || String(data.ky).trim() === "") {
        errs.push({ field: "ky", message: "Kỳ học không được để trống." });
    } else {
        const k = Number(data.ky);
        if (![1, 2, 3].includes(k)) {
            errs.push({ field: "ky", message: "Kỳ học phải là 1, 2 hoặc 3." });
        }
    }

    // Cho phép ngày học kỳ ở tương lai
    if (data.ngaybatdau) errs.push(date(data.ngaybatdau, "ngaybatdau", "Ngày bắt đầu", true));
    if (data.ngayketthuc) errs.push(date(data.ngayketthuc, "ngayketthuc", "Ngày kết thúc", true));

    return collect(...errs);
}

// ─── Lịch học ─────────────────────────────────────────────────────────────────

export interface LichHocPayload {
    maphancong?: number | string;
    thutrongtuan?: number | string;
    tietbatdau?: number | string;
    tietketthuc?: number | string;
    maphong?: string;
    ghichu?: string;
}

export function validateLichHoc(data: LichHocPayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [];

    if (data.maphancong === undefined || data.maphancong === null || String(data.maphancong).trim() === "") {
        errs.push({ field: "maphancong", message: "Mã phân công là bắt buộc." });
    }

    const thu = Number(data.thutrongtuan);
    if (isNaN(thu) || thu < 2 || thu > 8) {
        errs.push({ field: "thutrongtuan", message: "Thứ trong tuần không hợp lệ (nhập từ 2 đến 8)." });
    }

    const tbd = Number(data.tietbatdau);
    const tkt = Number(data.tietketthuc);
    if (isNaN(tbd) || tbd < 1 || tbd > 15 || isNaN(tkt) || tkt < 1 || tkt > 15) {
        errs.push({ field: "tietbatdau", message: "Tiết học phải từ 1 đến 15." });
    } else if (tbd > tkt) {
        errs.push({ field: "tietbatdau", message: "Tiết bắt đầu không thể lớn hơn tiết kết thúc." });
    }

    return collect(...errs);
}

// ─── Môn học ──────────────────────────────────────────────────────────────────

export interface MonHocPayload {
    mamon?: string;
    tenmon?: string;
    sotinchi?: number | string;
    sotietlythuyet?: number | string;
    sotietthuchanh?: number | string;
    mota?: string;
    batbuoc?: boolean;
    makhoa?: string;
}

export function validateMonHoc(data: MonHocPayload, isCreate = true): ValidationError[] {
    const errs: (ValidationError | null)[] = [];

    if (isCreate) {
        errs.push(required(data.mamon, "mamon", "Mã môn"));
    }
    errs.push(required(data.tenmon, "tenmon", "Tên môn"));
    errs.push(maxLen(data.mamon, "mamon", "Mã môn", 20));
    errs.push(maxLen(data.tenmon, "tenmon", "Tên môn", 150));

    const stc = Number(data.sotinchi);
    if (data.sotinchi === undefined || data.sotinchi === null || String(data.sotinchi).trim() === "" || isNaN(stc) || stc < 1 || stc > 10) {
        errs.push({ field: "sotinchi", message: "Số tín chỉ phải từ 1-10." });
    }

    return collect(...errs);
}

// ─── Phân công giảng dạy ──────────────────────────────────────────────────────

export interface PhanCongPayload {
    magv?: string;
    mamon?: string;
    malop?: string;
    mahocky?: number | string;
    malophoc?: string;
    sisomax?: number | string;
    danghieuluc?: boolean;
    ngaybatdau?: string;
    ngayketthuc?: string;
}

export function validatePhanCong(data: PhanCongPayload): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.magv, "magv", "Giảng viên"),
        required(data.mamon, "mamon", "Môn học"),
        required(data.malop, "malop", "Lớp học"),
    ];

    if (data.mahocky === undefined || data.mahocky === null || String(data.mahocky).trim() === "") {
        errs.push({ field: "mahocky", message: "Học kỳ là bắt buộc." });
    }

    if (data.sisomax !== undefined && data.sisomax !== null && String(data.sisomax).trim() !== "") {
        const maxSize = Number(data.sisomax);
        if (isNaN(maxSize) || maxSize <= 0) {
            errs.push({ field: "sisomax", message: "Sĩ số tối đa phải là số nguyên dương." });
        }
    }

    // Date validation
    if (data.ngaybatdau) errs.push(date(data.ngaybatdau, "ngaybatdau", "Ngày bắt đầu", true));
    if (data.ngayketthuc) errs.push(date(data.ngayketthuc, "ngayketthuc", "Ngày kết thúc", true));

    if (data.ngaybatdau && data.ngayketthuc) {
        const start = new Date(data.ngaybatdau);
        const end = new Date(data.ngayketthuc);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
            errs.push({ field: "ngaybatdau", message: "Ngày bắt đầu không thể lớn hơn ngày kết thúc." });
        }
    }

    return collect(...errs);
}

// ─── Thông báo ────────────────────────────────────────────────────────────────

export interface ThongBaoPayload {
    tieude?: string;
    noidung?: string;
    loai?: string;
    doituong?: string;
    malop?: string;
    maphancong?: number | string;
    ngayhethan?: string;
    ghim?: boolean;
    ngaytao?: string;
}

export function validateThongBao(data: ThongBaoPayload, isCreate = true): ValidationError[] {
    const errs: (ValidationError | null)[] = [
        required(data.tieude, "tieude", "Tiêu đề"),
        required(data.noidung, "noidung", "Nội dung"),
        maxLen(data.tieude, "tieude", "Tiêu đề", 250),
    ];

    if (isCreate) {
        errs.push(required(data.loai, "loai", "Loại thông báo"));
        errs.push(required(data.doituong, "doituong", "Đối tượng"));
    }

    if (data.loai !== undefined && data.loai !== null && String(data.loai).trim() !== "") {
        if (!Object.values(LoaiThongBao).includes(data.loai as any)) {
            errs.push({ field: "loai", message: "Loại thông báo không hợp lệ." });
        }
    }

    if (data.doituong !== undefined && data.doituong !== null && String(data.doituong).trim() !== "") {
        if (!Object.values(DoiTuongThongBao).includes(data.doituong as any)) {
            errs.push({ field: "doituong", message: "Đối tượng nhận thông báo không hợp lệ." });
        }
    }

    return collect(...errs);
}

// ─── Helper: lấy message đầu tiên (dùng trong setError của form) ───────────────

export function firstError(errors: ValidationError[]): string {
    return errors[0]?.message ?? "";
}