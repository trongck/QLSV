import { useCallback } from "react";
import { apiFetch, apiJson } from "../../services/service/admin/sinhvien.services/core.service";

export interface PhongHocRow {
  maphong: string;
  loaiphong: string;
  suchua: number;
}

export interface RoomSchedule {
  malichhoc: number;
  thutrongtuan: number;
  tietbatdau: number;
  tietketthuc: number;
  ghichu: string | null;
  monhoc: string;
  giangvien: string;
  lop: string;
  hocky: string;
}

export interface RoomUtilization {
  maphong: string;
  loaiphong: string;
  suchua: number;
  bookedPeriods: number;
  utilizationRate: number;
  status: "Overutilized" | "Healthy" | "Underutilized" | "Idle";
}

export function usePhongHoc() {
  const getPhongHoc = useCallback(async (): Promise<PhongHocRow[]> => {
    const res = await apiFetch("/api/admin/phonghoc");
    const json = await apiJson<{ success: boolean; data: PhongHocRow[] }>(res);
    return json.data;
  }, []);

  const createPhongHoc = useCallback(async (payload: PhongHocRow): Promise<PhongHocRow> => {
    const res = await apiFetch("/api/admin/phonghoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const json = await apiJson<{ success: boolean; data: PhongHocRow }>(res);
    return json.data;
  }, []);

  const updatePhongHoc = useCallback(async (maphong: string, payload: Omit<PhongHocRow, "maphong">): Promise<PhongHocRow> => {
    const res = await apiFetch(`/api/admin/phonghoc/${encodeURIComponent(maphong)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const json = await apiJson<{ success: boolean; data: PhongHocRow }>(res);
    return json.data;
  }, []);

  const deletePhongHoc = useCallback(async (maphong: string): Promise<void> => {
    const res = await apiFetch(`/api/admin/phonghoc/${encodeURIComponent(maphong)}`, {
      method: "DELETE",
    });
    await apiJson(res);
  }, []);

  const getRoomSchedules = useCallback(async (maphong: string): Promise<RoomSchedule[]> => {
    const res = await apiFetch(`/api/admin/phonghoc/${encodeURIComponent(maphong)}?schedule=true`);
    const json = await apiJson<{ success: boolean; data: RoomSchedule[] }>(res);
    return json.data;
  }, []);

  const getRoomUtilization = useCallback(async (): Promise<RoomUtilization[]> => {
    const res = await apiFetch("/api/admin/phonghoc?utilization=true");
    const json = await apiJson<{ success: boolean; data: RoomUtilization[] }>(res);
    return json.data;
  }, []);

  const checkRoomConflict = useCallback(async (params: {
    maphong: string;
    thutrongtuan: number;
    tietbatdau: number;
    tietketthuc: number;
    excludeLichHocId?: number;
  }): Promise<{ isConflict: boolean; conflicts: any[] }> => {
    const q = new URLSearchParams();
    q.set("conflict", "true");
    q.set("thutrongtuan", String(params.thutrongtuan));
    q.set("tietbatdau", String(params.tietbatdau));
    q.set("tietketthuc", String(params.tietketthuc));
    if (params.excludeLichHocId) {
      q.set("excludeLichHocId", String(params.excludeLichHocId));
    }

    const res = await apiFetch(`/api/admin/phonghoc/${encodeURIComponent(params.maphong)}?${q}`);
    return apiJson<{ isConflict: boolean; conflicts: any[] }>(res);
  }, []);

  return {
    getPhongHoc,
    createPhongHoc,
    updatePhongHoc,
    deletePhongHoc,
    getRoomSchedules,
    getRoomUtilization,
    checkRoomConflict,
  };
}
