import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchGrades(mahocky?: number | string): Promise<{
  grades: any[];
  gpaView: any | null;
  hocKyList: any[];
  hoten: string;
  mahocky?: number | string | null;
}> {
  const url = mahocky ? `/api/student/grades?mahocky=${mahocky}` : "/api/student/grades";
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`Lỗi tải điểm (${res.status})`);
  return res.json();
}
