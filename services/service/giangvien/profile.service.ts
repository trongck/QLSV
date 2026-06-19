import { GiangVien } from "@/types";
import { profileRepo } from "@/services/repositories/giangvien/profile.repo";

/** Map tên khoa hiển thị → mã khoa trong DB */
function mapKhoa(tenkhoa: string | undefined): string | null {
  if (!tenkhoa) return null;
  const map: Record<string, string> = {
    "Khoa Công nghệ thông tin": "CNTT",
    "Khoa Điện tử viễn thông": "DTVT",
    "Khoa Kinh tế và Quản lý": "KTVQL",
    "Khoa Khoa học cơ bản": "KHCB",
  };
  return map[tenkhoa] ?? tenkhoa;
}

/** Validate gioitinh theo đúng CHECK constraint của DB */
function normalizeGioiTinh(val: string | undefined): "Nam" | "Nu" | "Khac" | null {
  if (val === "Nam" || val === "Nu" || val === "Khac") return val;
  if (val === "Nữ") return "Nu";
  if (val === "Khác") return "Khac";
  return null;
}

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

  /**
   * Cập nhật thông tin giảng viên
   */
  async updateProfile(mataikhoan: string, profileData: any) {
    const nameStr = profileData.hoten?.trim() || "";
    const parts = nameStr.split(/\s+/);
    const ten = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    const hodem = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";

    const { error: gvError } = await profileRepo.updateProfile(mataikhoan, {
      hodem:       hodem               || null,
      ten:         ten                 || null,
      emailtruong: profileData.email?.trim()       ?? null,
      makhoa:      mapKhoa(profileData.faculty),
      ngaysinh:    profileData.ngaysinh            ?? null,
      gioitinh:    normalizeGioiTinh(profileData.gioitinh),
      hocvi:       profileData.hocvi?.trim()       || null,
      chuyennganh: profileData.chuyennganh?.trim() || null,
      anhdaidien:  profileData.anhdaidien?.trim()  || null,
      thanhtuu:    profileData.thanhtuu?.trim()    || null,
      diachi:      profileData.diachi?.trim()      || null,
      sodienthoai: profileData.sodienthoai?.trim() || null,
      emailcanhan: profileData.emailcanhan?.trim() || null,
    });

    if (gvError) {
      console.error("Lỗi cập nhật giangvien:", gvError.message);
      throw gvError;
    }

    // Đồng bộ email đăng nhập trong bảng taikhoan nếu email thay đổi
    if (profileData.email?.trim()) {
      const { error: tkError } = await profileRepo.updateTaikhoanEmail(mataikhoan, profileData.email.trim());
      if (tkError) {
        console.warn("Cảnh báo: không thể đồng bộ email taikhoan:", tkError.message);
      }
    }

    return true;
  }
};
