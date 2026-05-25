import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchAssignments(): Promise<{
  success: boolean; data: any[]; message?: string;
}> {
  const res = await apiFetch("/api/student/assignment");
  if (!res.ok) throw new Error(`Lỗi tải bài tập (${res.status})`);
  return res.json();
}

export async function uploadFile(
  file: File
): Promise<{ success: boolean; url?: string; fileName?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/api/student/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Lỗi upload file (${res.status})`);
  return res.json();
}

export async function submitAssignment(
  mabaitap: number,
  noidungnop: string | null,
  filenop: string | null
): Promise<{ success: boolean; updated?: boolean; message?: string }> {
  const res = await apiFetch("/api/student/assignment", {
    method: "POST",
    body: JSON.stringify({ mabaitap, noidungnop, filenop }),
  });
  if (!res.ok) throw new Error(`Lỗi nộp bài (${res.status})`);
  return res.json();
}
