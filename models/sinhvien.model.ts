
import {
  SinhVien,
  ChiTietSinhVien,
  Lop,
  TaiKhoan,
  GioiTinh,
  TrangThaiSinhVien,
} from "@/types";
import { PaginationParams } from "./common.model";

// ─── Extended (JOIN) ──────────────────────────────────────────────────────────

export interface SinhVienFull extends SinhVien {
  chiTiet?: ChiTietSinhVien;
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
  chiTiet?: Omit<ChiTietSinhVien, "masv">;
}

export interface UpdateSinhVienRequest {
  hoten?: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  anhdaidien?: string;
  malop?: string;
  trangthai?: TrangThaiSinhVien;
  chiTiet?: Partial<Omit<ChiTietSinhVien, "masv">>;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface SinhVienQueryParams extends PaginationParams {
  malop?: string;
  makhoa?: string;
  trangthai?: TrangThaiSinhVien;
  search?: string;
}