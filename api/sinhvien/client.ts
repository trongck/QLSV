import { apiFetch } from "@/services/service/auth/auth.service";

/**
 * Wrapper xung quanh apiFetch dành riêng cho phân hệ Sinh viên.
 * Tự động kiểm tra res.ok, nếu lỗi sẽ parse JSON để lấy thông tin lỗi và throw Error.
 */
export async function studentFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await apiFetch(url, init);
  if (!res.ok) {
    let errMsg = `Yêu cầu thất bại với mã trạng thái ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      // Bỏ qua lỗi parse JSON nếu body không phải JSON
    }
    throw new Error(errMsg);
  }
  return res;
}
