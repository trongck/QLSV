

import {
  GiangVien,
  ChiTietGiangVien,
  Khoa,
  TaiKhoan,
  GioiTinh,
} from "@/types";
import { PaginationParams } from "./common.model";

// ─── Extended (JOIN) ──────────────────────────────────────────────────────────

export interface GiangVienFull extends GiangVien {
  chiTiet?: ChiTietGiangVien;
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
  chiTiet?: Omit<ChiTietGiangVien, "magv">;
}

export interface UpdateGiangVienRequest {
  hoten?: string;
  ngaysinh?: string;
  gioitinh?: GioiTinh;
  hocvi?: string;
  chuyennganh?: string;
  anhdaidien?: string;
  makhoa?: string;
  chiTiet?: Partial<Omit<ChiTietGiangVien, "magv">>;
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface GiangVienQueryParams extends PaginationParams {
  makhoa?: string;
  search?: string;
}