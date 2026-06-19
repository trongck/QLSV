import { rosterRepo } from "@/services/repositories/giangvien/roster.repo";

interface RosterSvMonHoc {
  masv: string;
  sinhvien: {
    mataikhoan: string | null;
    hodem: string | null;
    ten: string | null;
    malop: string;
    emailtruong: string | null;
    sodienthoai: string | null;
    emailcanhan: string | null;
    tenphuhuynh: string | null;
    sodienthoaiphuhuynh: string | null;
    diachitamtru: string | null;
    diachithuongtru: string | null;
  } | null;
}

export const rosterService = {
  /**
   * Lấy danh sách học sinh theo lớp phân công từ Supabase
   */
  async getRosterStudents(maphancong: number) {
    const { data, error } = await rosterRepo.getRosterStudents(maphancong);

    if (error) throw error;

    return (data as unknown as RosterSvMonHoc[] ?? []).map(item => {
      const sv = item.sinhvien;
      const hoten = sv ? `${sv.hodem || ""} ${sv.ten || ""}`.trim() : "—";
      return {
        mssv: item.masv,
        accountId: sv?.mataikhoan ?? null,
        name: hoten || "—",
        class: sv?.malop ?? "—",
        phone: sv?.sodienthoai ?? "—",
        email: sv?.emailcanhan ?? sv?.emailtruong ?? "—",
        parent: sv ? `${sv.tenphuhuynh ?? "Chưa rõ"} - ${sv.sodienthoaiphuhuynh ?? "Chưa rõ"}` : "—",
        parentName: sv?.tenphuhuynh ?? "",
        parentPhone: sv?.sodienthoaiphuhuynh ?? "",
        address: sv?.diachithuongtru ?? sv?.diachitamtru ?? "—",
        rawAddress: sv?.diachithuongtru ?? ""
      };
    });
  },

  /**
   * Cập nhật thông tin hồ sơ chi tiết sinh viên trực tiếp trên bảng sinhvien
   */
  async updateRosterStudent(
    masv: string,
    updateData: {
      name: string;
      email: string;
      phone: string;
      parentName: string;
      parentPhone: string;
      address: string;
    }
  ) {
    // Tách họ tên thành hodem và ten
    const nameParts = updateData.name.trim().split(/\s+/);
    let hodem = "";
    let ten = "";
    if (nameParts.length > 1) {
      ten = nameParts[nameParts.length - 1];
      hodem = nameParts.slice(0, -1).join(" ");
    } else {
      ten = nameParts[0] || "";
    }

    // Cập nhật họ tên và các trường liên hệ trực tiếp trong bảng sinhvien
    const { error } = await rosterRepo.updateRosterStudent(masv, {
      hodem,
      ten,
      emailcanhan: updateData.email,
      sodienthoai: updateData.phone,
      tenphuhuynh: updateData.parentName,
      sodienthoaiphuhuynh: updateData.parentPhone,
      diachithuongtru: updateData.address
    });

    if (error) throw error;
    return true;
  },
};
