import { apiFetch } from "@/services/service/auth/auth.service";

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number;
}

/** Tính thống kê tổng hợp từ dữ liệu chi tiết theo môn */
export function computeAttendanceStats(subjectData: any[]): AttendanceStats {
  let total = 0, present = 0, absent = 0, late = 0, excused = 0;
  subjectData.forEach((s) => {
    total    += s.tongbuoi  ?? 0;
    present  += s.comat     ?? 0;
    absent   += s.vang      ?? 0;
    late     += s.tremuon   ?? 0;
    excused  += s.phepvang  ?? 0;
  });
  return { total, present, absent, late, excused,
    rate: total > 0 ? Math.round((present / total) * 100) : 0 };
}

export async function fetchAttendanceHistory(options?: {
  mahocky?: number;
  month?: number;
  year?: number;
  maphancong?: number;
}): Promise<{ success: boolean; data: any[] }> {
  const p = new URLSearchParams();
  p.set("mode", "history"); // Yêu cầu từ API backend
  if (options?.mahocky)    p.set("mahocky",    String(options.mahocky));
  if (options?.month)      p.set("month",      String(options.month));
  if (options?.year)       p.set("year",       String(options.year));
  if (options?.maphancong) p.set("maphancong", String(options.maphancong));
  const qs = p.toString() ? `?${p}` : "";
  const res = await apiFetch(`/api/student/attendance${qs}`);
  if (!res.ok) throw new Error(`Lỗi tải điểm danh (${res.status})`);
  return res.json();
}

export async function fetchAttendanceStats(
  mahocky?: number
): Promise<{ success: boolean; data: any[] }> {
  const p = new URLSearchParams();
  p.set("mode", "stats");
  if (mahocky) p.set("mahocky", String(mahocky));
  const qs = p.toString() ? `?${p}` : "";
  const res = await apiFetch(`/api/student/attendance${qs}`);
  if (!res.ok) throw new Error(`Lỗi tải thống kê điểm danh (${res.status})`);
  return res.json();
}

export async function checkIn(
  mabuoihoc: number,
  phuongthuc: "qr" | "face"
): Promise<{ success: boolean; message?: string }> {
  const res = await apiFetch("/api/student/attendance/checkin", {
    method: "POST",
    body: JSON.stringify({ mabuoihoc, phuongthuc }),
  });
  if (!res.ok) throw new Error(`Lỗi điểm danh (${res.status})`);
  return res.json();
}
