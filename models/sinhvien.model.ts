
import {
  SinhVien,
  Lop,
  TaiKhoan,
  GioiTinh,
  TrangThaiSinhVien,
} from "@/types";
import { PaginationParams } from "./common.model";

// ─── Extended (JOIN) ──────────────────────────────────────────────────────────

export interface SinhVienFull extends SinhVien {
  lop?: Lop;
  taikhoan?: Omit<TaiKhoan, "matkhau">;
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface CreateSinhVienRequest {
  masv: string;
  malop: string;
  hoten: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  emailtruong?: string;
  email: string;      // tạo tài khoản đồng thời
  matkhau: string;
  // Chi tiết (đã merged vào bảng sinhvien)
  quequan?: string;
  diachi?: string;
  sodienthoai?: string;
  emailcanhan?: string;
  tenphuhuynh?: string;
  sodienthoaiphuhuynh?: string;
  cccd?: string;
  ngaycapcccd?: string;
  noicapcccd?: string;
  dantoc?: string;
  tongiao?: string;
}

export interface UpdateSinhVienRequest {
  hoten?: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  anhdaidien?: string;
  malop?: string;
  trangthai?: TrangThaiSinhVien;
  // Chi tiết (đã merged vào bảng sinhvien)
  quequan?: string;
  diachi?: string;
  sodienthoai?: string;
  emailcanhan?: string;
  tenphuhuynh?: string;
  sodienthoaiphuhuynh?: string;
  cccd?: string;
  ngaycapcccd?: string;
  noicapcccd?: string;
  dantoc?: string;
  tongiao?: string;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface SinhVienQueryParams extends PaginationParams {
  malop?: string;
  makhoa?: string;
  trangthai?: TrangThaiSinhVien;
  search?: string;
}