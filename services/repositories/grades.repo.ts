/**
 * services/repositories/grades.repo.ts
 * Tầng truy cập dữ liệu cho Kết quả học tập (Sinh viên).
 */
import { apiFetch, apiJson } from "./api.utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HocKyItem {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  danghieuluc: boolean;
}

export interface DiemThanhPhan {
  loai: string;   // "GiuaKy" | "CuoiKy" | "ThucHanh" | ...
  giatri: number;
  heso: number;
}

export interface GradeItem {
  stt: number;
  mamon: string;
  malophoc: string;
  tenmon: string;
  sotinchi: number;
  giangvien: string;
  diem10: number | null;
  diem4: number | null;
  diemchu: string | null;
  ketqua: string | null;
  dat: boolean;
  coDiem: boolean;
  diemThanhPhan: DiemThanhPhan[];
}

export interface GradesSummary {
  gpa: number | null;
  totalTinchi: number;
  totalTinchiDat: number;
  soMon: number;
  soMonDat: number;
  soMonKhongDat: number;
  gpaThongKe: number | null;
  tinchiThongKe: number | null;
  tilechuyencan: number | null;
}

export interface GradesResponse {
  hocKyList: HocKyItem[];
  mahocky: number;
  hocKy: HocKyItem | null;
  grades: GradeItem[];
  summary: GradesSummary;
}

// ─── Repository Functions ─────────────────────────────────────────────────────

/** Lấy bảng điểm của sinh viên theo học kỳ */
export async function getStudentGrades(mahocky?: number): Promise<GradesResponse> {
  const q = new URLSearchParams();
  if (mahocky) q.set("mahocky", String(mahocky));
  const res = await apiFetch(`/api/student/grades${q.toString() ? `?${q}` : ""}`);
  return apiJson<GradesResponse>(res);
}
