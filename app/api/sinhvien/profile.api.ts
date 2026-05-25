import { apiFetch } from "@/services/service/auth/auth.service";

export async function fetchProfile(): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch("/api/student/profile");
  if (!res.ok) throw new Error(`Lỗi tải hồ sơ (${res.status})`);
  return res.json();
}

export async function updateProfile(payload: Record<string, unknown>): Promise<{
  success: boolean; data: any; error?: string;
}> {
  const res = await apiFetch("/api/student/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lỗi cập nhật hồ sơ (${res.status})`);
  return res.json();
}

export async function registerFace(embedding: number[]): Promise<{
  success: boolean; message?: string; error?: string;
}> {
  const res = await apiFetch("/api/student/profile", {
    method: "PATCH",
    body: JSON.stringify({ face_embedding: embedding }),
  });
  if (!res.ok) throw new Error(`Lỗi đăng ký khuôn mặt (${res.status})`);
  return res.json();
}
