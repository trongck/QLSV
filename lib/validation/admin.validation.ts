/**
 * lib/validation/admin.validation.ts
 *
 * Tập trung toàn bộ logic kiểm tra dữ liệu đầu vào cho các form Admin.
 * Dùng chung cho cả INSERT (create) và UPDATE (edit) — trường nào undefined
 * hoặc không có trong payload thì bỏ qua (partial update).
 *
 * Cách dùng:
 *   const errs = validateKhoa({ tenkhoa: "" });
 *   if (errs.length) { setError(errs[0]); return; }
 */

// ─── Kiểu trả về ──────────────────────────────────────────────────────────────

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

function date(value: unknown, field: string, label: string): ValidationError | null {
    if (value === undefined || value === null) return null;
    const str = String(value).trim();
    if (!str) return null;
    if (!DATE_RE.test(str)) return { field, message: `${label} phải có định dạng YYYY-MM-DD.` };
    const d = new Date(str);
    if (isNaN(d.getTime())) return { field, message: `${label} không phải ngày hợp lệ.` };
    if (d > new Date()) return { field, message: `${label} không thể là ngày trong tương lai.` };
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

/**
 * @param isCreate true → kiểm tra các trường bắt buộc cho INSERT
 */
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

    // Định dạng khoá học nếu nhập: VD "2022-2026"
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

const VALID_GIOITINH = ["Nam", "Nu", "Khac"];
const VALID_TRANGTHAI_SV = ["Danghoc", "Baoluu", "Thoi", "Totnghiep"];

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
        required(data.hoten, "hoten", "Họ và tên"), // bắt buộc khi có mặt trong payload update
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

const VALID_TRANGTHAI_TK = ["HoatDong", "Khoa"];

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

// ─── Helper: lấy message đầu tiên (dùng trong setError của form) ───────────────

export function firstError(errors: ValidationError[]): string {
    return errors[0]?.message ?? "";
}