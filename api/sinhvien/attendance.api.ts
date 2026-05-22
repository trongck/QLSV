import { studentFetch } from "./client";

export interface AttendanceStats {
  total: number;
  coMat: number;
  muon: number;
  vangKhongPhep: number;
}

export async function fetchAttendanceHistory(options?: {
  mahocky?: number;
  month?: number;
  year?: number;
  maphancong?: number;
}) {
  const q = new URLSearchParams();
  q.set("mode", "history");
  if (options?.mahocky) q.set("mahocky", String(options.mahocky));
  if (options?.month) q.set("month", String(options.month));
  if (options?.year) q.set("year", String(options.year));
  if (options?.maphancong) q.set("maphancong", String(options.maphancong));
  const res = await studentFetch(`/api/student/attendance?${q.toString()}`);
  return res.json();
}

export async function fetchAttendanceStats(mahocky?: number) {
  const q = new URLSearchParams();
  q.set("mode", "stats");
  if (mahocky) q.set("mahocky", String(mahocky));
  const res = await studentFetch(`/api/student/attendance?${q.toString()}`);
  return res.json();
}

export async function checkIn(mabuoihoc: number, phuongthuc: "qr" | "face") {
  const res = await studentFetch("/api/student/attendance", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mabuoihoc, phuongthuc }),
  });
  return res.json();
}

export function computeAttendanceStats(data: any[]): AttendanceStats {
  const total = data.reduce((s, i) => s + (i.total || 0), 0);
  const coMat = data.reduce((s, i) => s + (i.coMat || 0), 0);
  const muon = data.reduce((s, i) => s + (i.muon || 0), 0);
  const vangKhongPhep = data.reduce((s, i) => s + (i.vangKhongPhep || 0), 0);
  return { total, coMat, muon, vangKhongPhep };
}
