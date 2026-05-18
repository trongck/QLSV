import {
  VaiTro, TrangThaiTaiKhoan, GioiTinh, TrangThaiSinhVien, TrangThaiSinhVienMonHoc, TrangThaiBuoiHoc,
  TrangThaiDiemDanh, PhuongThucDiemDanh, TrangThaiDonXinNghi, LoaiBaiTap, LoaiTaiLieu, LoaiCauHoi, TrangThaiKetQuaThi,
  LoaiDiem, KetQuaDiem, LoaiThongBao, DoiTuongThongBao, LoaiCuocTroChuyen, LoaiPhongHoc
} from "./enum";
export * from "./enum";

// ─── Tài Khoản & Xác Thực ────────────────────────────────────────────────────

export interface TaiKhoan {
  mataikhoan: string;
  email: string;
  matkhau: string;
  vaitro: VaiTro;
  trangthai: TrangThaiTaiKhoan;
  dangnhaplancuoi: Date | null;
}

export interface PhienDangNhap {
  maphien: number;
  mataikhoan: string | null;
  refreshtoken: string;
  diachiip: string | null;
  thoigianhethan: Date;
  ngaytao: Date | null;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface Admin {
  maadmin: string;
  mataikhoan: string | null;
  hoten: string;
}

// ─── Giảng Viên ───────────────────────────────────────────────────────────────

export interface GiangVien {
  magv: string;
  mataikhoan: string | null;
  makhoa: string | null;
  hoten: string;
  ngaysinh: Date | null;
  gioitinh: GioiTinh | null;
  hocvi: string | null;
  chuyennganh: string | null;
  anhdaidien: string | null;
  emailtruong: string | null;
  thanhtuu: string | null;
  // Merged from chitietgiangvien
  diachi: string | null;
  sodienthoai: string | null;
  emailcanhan: string | null;
  ngayvaotruong: Date | null;
  hesoluong: number | null;
}

// ─── Sinh Viên ────────────────────────────────────────────────────────────────

export interface SinhVien {
  masv: string;
  mataikhoan: string | null;
  malop: string;
  hoten: string;
  ngaysinh: Date | null;
  gioitinh: GioiTinh | null;
  anhdaidien: string | null;
  emailtruong: string | null;
  trangthai: TrangThaiSinhVien;
  // Merged from chitietsinhvien
  quequan: string | null;
  diachi: string | null;
  sodienthoai: string | null;
  emailcanhan: string | null;
  tenphuhuynh: string | null;
  sodienthoaiphuhuynh: string | null;
  cccd: string | null;
  ngaycapcccd: Date | null;
  noicapcccd: string | null;
  dantoc: string | null;
  tongiao: string | null;
  face_embedding: number[] | null;
}

// ─── Khoa & Lớp ───────────────────────────────────────────────────────────────

export interface Khoa {
  makhoa: string;
  tenkhoa: string;
  dienthoai: string | null;
  email: string | null;
  ngaytao: Date;
}

export interface Lop {
  malop: string;
  makhoa: string | null;
  tenlop: string;
  nganh: string | null;
  khoahoc: string | null;
  magv: string | null;
  // siso removed — use vcount_siso VIEW or count sinhvien dynamically
}

// ─── Môn Học & Học Kỳ ────────────────────────────────────────────────────────

export interface MonHoc {
  mamon: string;
  makhoa: string | null;
  tenmon: string;
  sotinchi: number;
  sotietlythuyet: number | null;
  sotietthuchanh: number | null;
  mota: string | null;
  batbuoc: boolean;
  ngaytao: Date;
}

export interface HocKy {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: 1 | 2 | 3;
  ngaybatdau: Date | null;
  ngayketthuc: Date | null;
  danghieuluc: boolean;
}

// ─── Phân Công & Lịch Học ────────────────────────────────────────────────────

export interface PhanCong {
  maphancong: number;
  magv: string;
  mamon: string;
  malop: string;
  mahocky: number;
  malophoc: string | null;
  sisomax: number | null;
  danghieuluc: boolean;
  ngaybatdau: Date | null;
  ngayketthuc: Date | null;
  ngaytao: Date;
}

export interface PhongHoc {
  maphong: string;
  loaiphong: LoaiPhongHoc;
  suchua: number;
}

export interface LichHoc {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number; // 2–8 (Thứ 2 → Chủ nhật)
  tietbatdau: number;   // 1–15
  tietketthuc: number;  // 1–15
  maphong: string | null;
  tuantu_batdau: number | null;  // [FIX-5] Tuần bắt đầu hiệu lực (null = cả học kỳ)
  tuantu_ketthuc: number | null; // [FIX-5] Tuần kết thúc hiệu lực
  ghichu: string | null;
}

export interface SinhVienMonHoc {
  masv: string;
  maphancong: number;
  ngaythem: Date;
  trangthai: TrangThaiSinhVienMonHoc;
}

// ─── Buổi Học & Điểm Danh ────────────────────────────────────────────────────

export interface BuoiHoc {
  mabuoihoc: number;
  malichhoc: number;
  ngayhoc: Date;
  noidung: string | null;
  trangthai: TrangThaiBuoiHoc;
  qr_secret: string | null; // null = chưa mở điểm danh, có giá trị = đang mở
  ngaytao: Date;
}

export interface DiemDanh {
  madiemdanh: number;
  mabuoihoc: number;
  masv: string;
  trangthai: TrangThaiDiemDanh;
  phuongthuc: PhuongThucDiemDanh; // QR | Face | Manual
  ghichu: string | null;
  thoigiandiemdanh: Date | null;
  ngaytao: Date;
}

export interface DonXinNghi {
  madon: number;
  masv: string;
  mabuoihoc: number;
  lydo: string;
  minhchung: string | null;
  trangthai: TrangThaiDonXinNghi;
  magvduyet: string | null;
  ghichugv: string | null;
  ngaytao: Date;
  ngaycapnhat: Date;
}

// ─── Bài Tập & Nộp Bài ───────────────────────────────────────────────────────

export interface BaiTap {
  mabaitap: number;
  maphancong: number;
  // magv removed — derive via phancong.magv [FIX-14]
  tieude: string;
  mota: string | null;
  filedinh: string | null;
  hannop: Date;
  diemtoida: number;
  loai: LoaiBaiTap;
  ngaytao: Date;
  ngaycapnhat: Date;
}

export interface NopBai {
  manopbai: number;
  mabaitap: number;
  masv: string;
  noidungnop: string | null;
  filenop: string | null;
  thoigiannop: Date;
  trenop: boolean;
  diem: number | null;
  nhanxet: string | null;
  magvcham: string | null;
  thoigiancham: Date | null;
}

// ─── Thi Trực Tuyến ───────────────────────────────────────────────────────────

export interface DeThi {
  madethi: number;
  maphancong: number;
  // magvtao removed — derive via phancong.magv [FIX-14]
  tieude: string;
  mota: string | null;
  thoigianlam: number; // phút
  thoigianbatdau: Date;
  thoigianketthuc: Date;
  matkhau: string | null;
  xaotroncauhoi: boolean;
  xaotrondapan: boolean;
  solan: number;
  hienthidapan: boolean;
  ngaytao: Date;
  ngaycapnhat: Date;
}

export interface CauHoi {
  macauhoi: number;
  madethi: number;
  noidung: string;
  hinhanh: string | null;
  loaicauhoi: LoaiCauHoi;
  diem: number;
  thutu: number | null;
  ngaytao: Date;
}

export interface DapAn {
  madapan: number;
  macauhoi: number;
  noidung: string;
  ladapandung: boolean;
  thutu: number | null;
  giaithich: string | null;
}

export interface KetQuaThi {
  maketqua: number;
  madethi: number;
  masv: string;
  lanthi: number;
  thoigianvaothi: Date;
  thoigiannopbai: Date | null;
  diemtong: number | null;
  socandung: number;
  trangthai: TrangThaiKetQuaThi;
  ghichu: string | null;
}

export interface ChiTietBaiLam {
  machitiet: number;
  maketqua: number;
  macauhoi: number;
  madapan: number | null;
  cautraloituluan: string | null;
  diemdatduoc: number;
  dagvcham: boolean;
}

// ─── Điểm ─────────────────────────────────────────────────────────────────────

export interface Diem {
  madiem: number;
  masv: string;
  maphancong: number;
  loaidiem: LoaiDiem;
  giatri: number;
  heso: number;
  ghichu: string | null;
  magvnhap: string | null;
  ngaytao: Date;
  ngaycapnhat: Date;
}

export interface DiemTongKet {
  masv: string;
  maphancong: number;
  diemtongket: number | null;
  diemchu: string | null;
  ketqua: KetQuaDiem | null;
  ngaycapnhat: Date;
}

// ─── Tài Liệu ─────────────────────────────────────────────────────────────────

export interface TaiLieu {
  matailieu: number;
  maphancong: number;
  // magv removed — derive via phancong.magv [FIX-14]
  tieude: string;
  mota: string | null;
  loai: LoaiTaiLieu;
  duongdan: string;
  dungluong: number | null; // bytes
  luotxem: number;
  chopheptai: boolean;
  ngaytao: Date;
  ngaycapnhat: Date;
}

// ─── Thông Báo ────────────────────────────────────────────────────────────────

export interface ThongBao {
  mathongbao: number;
  mataikhoantao: string; // [FIX-10] Unified — replaces magvtao + maadmintao
  tieude: string;
  noidung: string;
  loai: LoaiThongBao;
  doituong: DoiTuongThongBao;
  malop: string | null;
  maphancong: number | null;
  ngayhethan: Date | null;
  ghim: boolean;
  ngaytao: Date;
  ngaycapnhat: Date;
}

/** [FIX-13] Unified read-status table — replaces ThongBaoDaDocSV + ThongBaoDaDocGV */
export interface ThongBaoDaDoc {
  mathongbao: number;
  mataikhoan: string;
  dadoc: boolean;
  thoigiandoc: Date | null;
}

// ─── Nhắn Tin ─────────────────────────────────────────────────────────────────

export interface CuocTroChuyen {
  macuoctrochuyen: number;
  maphancong: number | null;
  tieude: string | null;
  loai: LoaiCuocTroChuyen; // CaNhan | Nhom
  ngaytao: Date;
  nguoidaxoa: string[];
}

/** [FIX-11] Unified — replaces masv/magv with mataikhoan, PK added */
export interface ThanhVienTroChuyen {
  macuoctrochuyen: number;
  mataikhoan: string;
  vaitro: string | null;
  ngaythamgia: Date;
  thoigianxemcuoi: Date | null;
}

/** [FIX-12] Unified sender — replaces masvgui/magvgui */
export interface TinNhan {
  matinnhan: number;
  macuoctrochuyen: number;
  mataikhoangui: string;
  noidung: string;
  filedinh: string | null;
  dachinh: boolean;
  ngaytao: Date;
  ngaycapnhat: Date;
  nguoidaxoa: string[];
}

// ─── Nhật Ký ──────────────────────────────────────────────────────────────────

export interface NhatKy {
  manhatky: number;
  masv: string | null;
  magv: string | null;
  tieude: string | null;
  noidung: string;
  tamtrang: 1 | 2 | 3 | 4 | 5 | null;
  maphancong: number | null;
  ngaytao: Date;
  ngaycapnhat: Date;
}

// ─── Thống Kê ─────────────────────────────────────────────────────────────────

/** View-backed statistics (from vthongke_sinhvien VIEW) */
export interface ThongKeSinhVien {
  masv: string;
  mahocky: number;
  gpa: number | null;
  sotinchi: number | null;
  sotinchidat: number | null;
  tilechuyencan: number | null;
  somondat: number | null;
  somonkhongdat: number | null;
}

/** View-backed statistics (from vthongke_phancong VIEW) */
export interface ThongKePhanCong {
  maphancong: number;
  sisohientai: number | null;
  diemtb: number | null;
  tilelop: number | null;
  tilechuyencan: number | null;
  sobaitapcho: number | null;
  sobaitapdanop: number | null;
}

// ─── Nhật Ký Hệ Thống (Audit Log) ────────────────────────────────────────────

export interface NhatKyHeThong {
  manhatky: number;
  mataikhoan: string | null;
  hanhdong: string;
  tentable: string | null;
  makhoachinh: string | null;
  giatricu: Record<string, unknown> | null;
  giatrimoi: Record<string, unknown> | null;
  diachiip: string | null;
  ngaytao: Date;
}

// ─── Authentication Models (Moved from @/models) ────────────────────────────

export interface LoginRequest {
  email: string;
  matkhau: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserProfile {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
  hoten: string;
  anhdaidien: string | null;
  maSinhVien?: string;
  maGiangVien?: string;
  maAdmin?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  mataikhoan: string;
  email: string;
  vaitro: VaiTro;
  iat: number;
  exp: number;
}