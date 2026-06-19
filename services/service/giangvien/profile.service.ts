import { GiangVien } from "@/types";
import { profileRepo } from "@/services/repositories/giangvien/profile.repo";

export const profileService = {
  /**
   * Lấy thông tin chi tiết của giảng viên dựa trên magv
   * Dữ liệu này sẽ bao gồm thông tin từ bảng giangvien và taikhoan liên kết
   */
  async getMyProfile(mataikhoan: string) {
    const { data, error } = await profileRepo.getProfileByMataikhoan(mataikhoan);

    if (error) {
      console.error("Lỗi khi truy vấn Supabase:", error.message);
      return null;
    }

    if (data) {
      return {
        ...data,
        hoten: `${data.hodem || ""} ${data.ten || ""}`.trim()
      } as unknown as GiangVien;
    }

    return null;
  },
};
