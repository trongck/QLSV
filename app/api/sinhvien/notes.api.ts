import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchNotes(): Promise<{
  success: boolean; data: any[]; message?: string;
}> {
  const res = await apiFetch("/api/student/notes");
  if (!res.ok) throw new Error(`Lỗi tải ghi chú (${res.status})`);
  return res.json();
}

export async function createNote(payload: Record<string, unknown>): Promise<{
  success: boolean; data: any; message?: string;
}> {
  const res = await apiFetch("/api/student/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lỗi tạo ghi chú (${res.status})`);
  return res.json();
}

export async function updateNote(
  manhatky: number,
  payload: Record<string, unknown>
): Promise<{ success: boolean; data: any; message?: string }> {
  const res = await apiFetch(`/api/student/notes/${manhatky}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lỗi cập nhật ghi chú (${res.status})`);
  return res.json();
}

export async function deleteNote(manhatky: number): Promise<{
  success: boolean; message?: string;
}> {
  const res = await apiFetch(`/api/student/notes/${manhatky}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Lỗi xóa ghi chú (${res.status})`);
  return res.json();
}
