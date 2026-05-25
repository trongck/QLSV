import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchExams(): Promise<{
  success: boolean; data: any[]; message?: string;
}> {
  const res = await apiFetch("/api/student/exam");
  if (!res.ok) throw new Error(`Lỗi tải bài thi (${res.status})`);
  return res.json();
}

export async function fetchExamDetail(madethi: number): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch(`/api/student/exam/${madethi}`);
  if (!res.ok) throw new Error(`Lỗi tải đề thi (${res.status})`);
  return res.json();
}

export async function submitExam(
  madethi: number,
  answers: { macauhoi: number; madapan: number | null; cautraloituluan: string | null }[],
  cheatCount?: number
): Promise<{ success: boolean; data: any; error?: string }> {
  const res = await apiFetch(`/api/student/exam/${madethi}`, {
    method: "POST",
    body: JSON.stringify({ answers, cheatCount }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài thi (${res.status})`);
  return res.json();
}

export async function fetchExamResult(madethi: number): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch(`/api/student/exam/${madethi}/result`);
  if (!res.ok) throw new Error(`Lỗi tải kết quả thi (${res.status})`);
  return res.json();
}
