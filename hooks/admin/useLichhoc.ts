import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { apiJson } from "../../services/service/admin/sinhvien.services/core.service";

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
  maphong: string | null;
  ghichu: string | null;
  phonghoc?: PhongHocRow | null;
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

export function useLichHoc() {
  const getLichHoc = useCallback(
    async (params: {
      maphancong?: string;
      thutrongtuan?: string;
      magv?: string;
      malop?: string;
      mahocky?: string;
      maphong?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<LichHocListResponse> => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") q.set(k, String(v));
      });
      const res = await apiFetch(`/api/admin/lichhoc?${q}`);
      return apiJson<LichHocListResponse>(res);
    },
    []
  );

  const createLichHoc = useCallback(async (payload: Partial<LichHocRow>): Promise<LichHocRow> => {
    const res = await apiFetch("/api/admin/lichhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ success: boolean; data: LichHocRow }>(res)).data;
  }, []);

  const updateLichHoc = useCallback(async (malichhoc: number, payload: Partial<LichHocRow>): Promise<LichHocRow> => {
    const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return (await apiJson<{ success: boolean; data: LichHocRow }>(res)).data;
  }, []);

  const deleteLichHoc = useCallback(async (malichhoc: number): Promise<void> => {
    const res = await apiFetch(`/api/admin/lichhoc/${malichhoc}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  return {
    getLichHoc,
    createLichHoc,
    updateLichHoc,
    deleteLichHoc,
  };
}
