import { apiFetch, apiJson } from "./core.service";

export interface PhongHocRow {
  maphong: string;
  loaiphong: "Lythuyet" | "Thuchanh" | "Online";
  suchua: number;
}

export interface LichHocRow {
  malichhoc: number;
  maphancong: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  maphong: string | null;      // FK → phonghoc.maphong
  ghichu: string | null;
  // Relations
  phonghoc?: PhongHocRow | null; // joined from phonghoc table
  phancong?: {
    maphancong: number;
    magv: string;
    mamon: string;
    malop: string;
    mahocky: number;
    malophoc: string | null;
    giangvien?: { hoten: string };
    monhoc?: { tenmon: string };
    lop?: { tenlop: string };
    hocky?: { tenhocky: string };
  };
}

export interface LichHocListResponse {
  data: LichHocRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function getLichHoc(params: {
  maphancong?: string;
  thutrongtuan?: string;
  magv?: string;
  malop?: string;
  mahocky?: string;
  maphong?: string;          // filter theo mã phòng
  page?: number;
  limit?: number;
} = {}): Promise<LichHocListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, String(v));
  });
  const res = await apiFetch(`/api/admin/lichhoc?${q}`);
  return apiJson<LichHocListResponse>(res);
}

export async function createLichHoc(payload: Partial<LichHocRow>): Promise<LichHocRow> {
  const res = await apiFetch("/api/admin/lichhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: LichHocRow }>(res)).data;
}

export async function updateLichHoc(malichhoc: number, payload: Partial<LichHocRow>): Promise<LichHocRow> {
  const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await apiJson<{ data: LichHocRow }>(res)).data;
}

export async function deleteLichHoc(malichhoc: number): Promise<void> {
  const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
    method: "DELETE",
  });
  await apiJson(res);
}
