import { studentFetch } from "./client";

export interface HocKy {
  mahocky: number;
  tenhocky: string;
  namhoc: number;
  ky: number;
  ngaybatdau: string;
  ngayketthuc: string;
  danghieuluc: boolean;
}

export interface LichHoc {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  maphong: string | null;
  ghichu: string | null;
  timeRange: string;
  thuLabel: string;
  phancong?: {
    monhoc: { mamon: string; tenmon: string; sotinchi?: number } | null;
    giangvien: { magv: string; hoten: string } | null;
    hocky: HocKy | null;
    danghieuluc?: boolean;
    ngaybatdau?: string | null;
    ngayketthuc?: string | null;
  };
}

export async function fetchHocKyList() {
  const res = await studentFetch("/api/student/hocky");
  return res.json();
}

export async function fetchSchedule(mode: string, mahocky: number) {
  const res = await studentFetch(`/api/student/schedule?mode=${mode}&mahocky=${mahocky}`);
  return res.json();
}

