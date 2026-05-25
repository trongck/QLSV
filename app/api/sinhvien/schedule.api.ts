import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchHocKyList(): Promise<{ success: boolean; data: any[] }> {
  const res = await apiFetch("/api/student/hocky");
  if (!res.ok) throw new Error(`Lỗi tải học kỳ (${res.status})`);
  return res.json();
}

export async function fetchSchedule(
  viewMode: "week" | "semester",
  mahocky: number
): Promise<{ success: boolean; data: any[]; error?: string }> {
  const res = await apiFetch(`/api/student/schedule?mode=${viewMode}&mahocky=${mahocky}`);
  if (!res.ok) throw new Error(`Lỗi tải lịch học (${res.status})`);
  return res.json();
}
