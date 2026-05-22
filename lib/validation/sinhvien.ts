// lib/validate/sinhvien.ts
// Các hàm kiểm tra tính hợp lệ dữ liệu đầu vào cho phân quyền Sinh viên

// ─── Kiểu trả về kết quả validation ──────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ─── Thông tin cá nhân ────────────────────────────────────────────────────────

/** Kiểm tra họ tên (không được rỗng, tối thiểu 2 chữ, tối đa 100 ký tự) */
export function validateHoTen(hoten: unknown): ValidationResult {
  if (typeof hoten !== 'string' || !hoten.trim()) {
    return { valid: false, error: 'Họ tên không được để trống' };
  }
  if (hoten.trim().length < 2) {
    return { valid: false, error: 'Họ tên phải có ít nhất 2 ký tự' };
  }
  if (hoten.trim().length > 100) {
    return { valid: false, error: 'Họ tên không được vượt quá 100 ký tự' };
  }
  return { valid: true };
}

/** Kiểm tra số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0) */
export function validateSoDienThoai(sdt: unknown): ValidationResult {
  if (!sdt || sdt === '') return { valid: true }; // Không bắt buộc
  if (typeof sdt !== 'string') return { valid: false, error: 'Số điện thoại không hợp lệ' };
  const cleaned = sdt.trim().replace(/\s+/g, '');
  if (!/^(0[3-9]\d{8})$/.test(cleaned)) {
    return { valid: false, error: 'Số điện thoại không hợp lệ (VD: 0912345678)' };
  }
  return { valid: true };
}

/** Kiểm tra email cá nhân */
export function validateEmail(email: unknown): ValidationResult {
  if (!email || email === '') return { valid: true }; // Không bắt buộc
  if (typeof email !== 'string') return { valid: false, error: 'Email không hợp lệ' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Định dạng email không hợp lệ' };
  }
  if (email.trim().length > 150) {
    return { valid: false, error: 'Email không được vượt quá 150 ký tự' };
  }
  return { valid: true };
}

/** Kiểm tra CCCD (12 chữ số) */
export function validateCCCD(cccd: unknown): ValidationResult {
  if (!cccd || cccd === '') return { valid: true }; // Không bắt buộc
  if (typeof cccd !== 'string') return { valid: false, error: 'CCCD không hợp lệ' };
  if (!/^\d{12}$/.test(cccd.trim())) {
    return { valid: false, error: 'CCCD phải là 12 chữ số' };
  }
  return { valid: true };
}

/** Kiểm tra ngày sinh (không được là ngày tương lai, không được quá xa quá khứ) */
export function validateNgaySinh(ngaysinh: unknown): ValidationResult {
  if (!ngaysinh || ngaysinh === '') return { valid: true }; // Không bắt buộc
  const d = new Date(ngaysinh as string);
  if (isNaN(d.getTime())) {
    return { valid: false, error: 'Ngày sinh không hợp lệ' };
  }
  const now = new Date();
  if (d > now) {
    return { valid: false, error: 'Ngày sinh không thể là ngày trong tương lai' };
  }
  const minYear = now.getFullYear() - 100;
  if (d.getFullYear() < minYear) {
    return { valid: false, error: 'Ngày sinh không hợp lệ' };
  }
  return { valid: true };
}

/** Kiểm tra giới tính */
export function validateGioiTinh(gt: unknown): ValidationResult {
  if (!gt || gt === '') return { valid: true }; // Không bắt buộc
  const allowed = ['Nam', 'Nu', 'Nữ', 'Khac', 'Khác'];
  if (!allowed.includes(gt as string)) {
    return { valid: false, error: 'Giới tính không hợp lệ (Nam / Nu / Khac)' };
  }
  return { valid: true };
}

/** Kiểm tra toàn bộ thông tin cá nhân cần cập nhật */
export function validateUpdateProfile(body: {
  hoten?: unknown;
  sodienthoai?: unknown;
  emailcanhan?: unknown;
  cccd?: unknown;
  ngaysinh?: unknown;
  gioitinh?: unknown;
}): ValidationResult {
  if ('hoten' in body && body.hoten !== undefined && body.hoten !== null) {
    const r = validateHoTen(body.hoten);
    if (!r.valid) return r;
  }
  const sdtResult = validateSoDienThoai(body.sodienthoai);
  if (!sdtResult.valid) return sdtResult;

  const emailResult = validateEmail(body.emailcanhan);
  if (!emailResult.valid) return emailResult;

  const cccdResult = validateCCCD(body.cccd);
  if (!cccdResult.valid) return cccdResult;

  const nsResult = validateNgaySinh(body.ngaysinh);
  if (!nsResult.valid) return nsResult;

  const gtResult = validateGioiTinh(body.gioitinh);
  if (!gtResult.valid) return gtResult;

  return { valid: true };
}

// ─── Ghi chú nhật ký ─────────────────────────────────────────────────────────

/** Kiểm tra nội dung nhật ký */
export function validateNhatKy(body: {
  noidung?: unknown;
  tieude?: unknown;
  tamtrang?: unknown;
}): ValidationResult {
  if (!body.noidung || typeof body.noidung !== 'string' || !body.noidung.trim()) {
    return { valid: false, error: 'Nội dung ghi chú không được để trống' };
  }
  if (body.noidung.length > 10000) {
    return { valid: false, error: 'Nội dung quá dài (tối đa 10.000 ký tự)' };
  }
  if (body.tieude !== undefined && body.tieude !== null && typeof body.tieude === 'string') {
    if (body.tieude.length > 200) {
      return { valid: false, error: 'Tiêu đề quá dài (tối đa 200 ký tự)' };
    }
  }
  if (body.tamtrang !== undefined && body.tamtrang !== null) {
    const t = Number(body.tamtrang);
    if (!Number.isInteger(t) || t < 1 || t > 5) {
      return { valid: false, error: 'Tâm trạng phải là số từ 1 đến 5' };
    }
  }
  return { valid: true };
}

// ─── Nộp bài tập ─────────────────────────────────────────────────────────────

/** Kiểm tra dữ liệu nộp bài tập */
export function validateSubmitAssignment(body: {
  mabaitap?: unknown;
  noidungnop?: unknown;
  filenop?: unknown;
}): ValidationResult {
  if (!body.mabaitap || typeof body.mabaitap !== 'number' || !Number.isInteger(body.mabaitap) || body.mabaitap <= 0) {
    return { valid: false, error: 'Mã bài tập không hợp lệ' };
  }
  const hasContent = body.noidungnop && typeof body.noidungnop === 'string' && body.noidungnop.trim().length > 0;
  const hasFile = body.filenop && typeof body.filenop === 'string' && body.filenop.trim().length > 0;
  if (!hasContent && !hasFile) {
    return { valid: false, error: 'Phải có nội dung hoặc tệp đính kèm khi nộp bài' };
  }
  return { valid: true };
}

// ─── Face Embedding ───────────────────────────────────────────────────────────

/** Kiểm tra face embedding (mảng số thực 128 chiều) */
export function validateFaceEmbedding(embedding: unknown): ValidationResult {
  if (!Array.isArray(embedding)) {
    return { valid: false, error: 'Dữ liệu khuôn mặt không hợp lệ' };
  }
  if (embedding.length === 0) {
    return { valid: false, error: 'Dữ liệu khuôn mặt không được rỗng' };
  }
  if (!embedding.every((v) => typeof v === 'number' && isFinite(v))) {
    return { valid: false, error: 'Dữ liệu khuôn mặt phải là mảng số thực' };
  }
  return { valid: true };
}

// ─── Điểm danh ───────────────────────────────────────────────────────────────

/** Kiểm tra QR token điểm danh */
export function validateQRToken(token: unknown): ValidationResult {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return { valid: false, error: 'Token QR không được để trống' };
  }
  return { valid: true };
}

// ─── Tin nhắn ─────────────────────────────────────────────────────────────────

/** Kiểm tra nội dung tin nhắn */
export function validateTinNhan(body: {
  macuoctrochuyen?: unknown;
  noidung?: unknown;
}): ValidationResult {
  if (!body.macuoctrochuyen || typeof body.macuoctrochuyen !== 'number' || body.macuoctrochuyen <= 0) {
    return { valid: false, error: 'Mã cuộc trò chuyện không hợp lệ' };
  }
  if (!body.noidung || typeof body.noidung !== 'string' || !body.noidung.trim()) {
    return { valid: false, error: 'Nội dung tin nhắn không được để trống' };
  }
  if (body.noidung.length > 5000) {
    return { valid: false, error: 'Nội dung tin nhắn quá dài (tối đa 5.000 ký tự)' };
  }
  return { valid: true };
}

// ─── Đơn xin nghỉ phép ────────────────────────────────────────────────────────

/** Kiểm tra đơn xin nghỉ phép */
export function validateLeaveRequest(body: {
  malichhoc?: unknown;
  ngayhoc?: unknown;
  lydo?: unknown;
  minhchung?: unknown;
}): ValidationResult {
  if (!body.malichhoc || typeof body.malichhoc !== 'number' || !Number.isInteger(body.malichhoc) || body.malichhoc <= 0) {
    return { valid: false, error: 'Mã lịch học không hợp lệ' };
  }
  if (!body.ngayhoc || typeof body.ngayhoc !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.ngayhoc.trim())) {
    return { valid: false, error: 'Ngày học không hợp lệ (định dạng YYYY-MM-DD)' };
  }
  if (!body.lydo || typeof body.lydo !== 'string' || !body.lydo.trim()) {
    return { valid: false, error: 'Lý do xin nghỉ không được để trống' };
  }
  if (body.lydo.trim().length > 500) {
    return { valid: false, error: 'Lý do xin nghỉ không được quá 500 ký tự' };
  }
  return { valid: true };
}

