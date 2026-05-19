
import {
  GiangVien,
  Khoa,
  TaiKhoan,
  GioiTinh,
} from "@/types";
import { PaginationParams } from "./common.model";

// ─── Extended (JOIN) ──────────────────────────────────────────────────────────

export interface GiangVienFull extends GiangVien {
  khoa?: Khoa;
  taikhoan?: Omit<TaiKhoan, "matkhau">;
}

// ─── Request ──────────────────────────────────────────────────────────────────

export interface CreateGiangVienRequest {
  magv: string;
  makhoa?: string;
  hoten: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  hocvi?: string;
  chuyennganh?: string;
  emailtruong?: string;
  email: string;      // tạo tài khoản đồng thời
  matkhau: string;
  // Chi tiết (đã merged vào bảng giangvien)
  diachi?: string;
  sodienthoai?: string;
  emailcanhan?: string;
  ngayvaotruong?: string;
  hesoluong?: number;
}

export interface UpdateGiangVienRequest {
  hoten?: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  hocvi?: string;
  chuyennganh?: string;
  anhdaidien?: string;
  makhoa?: string;
  // Chi tiết (đã merged vào bảng giangvien)
  diachi?: string;
  sodienthoai?: string;
  emailcanhan?: string;
  hesoluong?: number;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface GiangVienQueryParams extends PaginationParams {
  makhoa?: string;
  search?: string;
}