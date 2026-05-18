"use client";

import { AdminModal } from "./Adminmodal";
import { TrangThaiSinhVien } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]: "Đang học",
  [TrangThaiSinhVien.Baoluu]: "Bảo lưu",
  [TrangThaiSinhVien.Thoi]: "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};

const SV_STATUS_BADGE: Record<string, string> = {
  [TrangThaiSinhVien.Danghoc]: "badge-green",
  [TrangThaiSinhVien.Baoluu]: "badge-yellow",
  [TrangThaiSinhVien.Thoi]: "badge-red",
  [TrangThaiSinhVien.Totnghiep]: "badge-blue",
};

interface ProfileDetailModalProps {
  isOpen: boolean;
  type: "sv" | "gv" | null;
  detail: any;
  loading: boolean;
  onClose: () => void;
}

export function ProfileDetailModal({
  isOpen,
  type,
  detail,
  loading,
  onClose,
}: ProfileDetailModalProps) {
  if (!isOpen) return null;

  return (
    <AdminModal
      title={
        type === "sv" ? "Hồ sơ chi tiết Sinh viên" : "Hồ sơ chi tiết Giảng viên"
      }
      onClose={onClose}
      size="lg"
    >
      {loading ? (
        <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
          Đang tải chi tiết hồ sơ từ cơ sở dữ liệu…
        </p>
      ) : !detail ? (
        <p className="p-8 text-sm text-[#8B6F5F] text-center m-0 font-medium">
          Không tìm thấy hồ sơ chi tiết.
        </p>
      ) : type === "sv" ? (
        <div>
          {/* Header Banner */}
          <div className="flex items-center gap-4 pb-4 border-b-2 border-[#FFDBB6] mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FBD9D9] to-[#FFDBB6] flex items-center justify-center text-2xl font-bold text-primary border-2 border-[#FFDBB6]">
              {detail.hoten?.charAt(0) || "S"}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-[#2D1B14] m-0">
                {detail.hoten}
              </h3>
              <div className="flex gap-2 mt-1">
                <span className="badge badge-peach">Sinh viên</span>
                <span
                  className={`badge ${SV_STATUS_BADGE[detail.trangthai] ?? "badge-peach"}`}
                >
                  {STATUS_LABEL[detail.trangthai] ?? detail.trangthai}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <h4 className="text-sm font-bold text-primary mt-[18px] mb-2.5 pb-1 border-b border-dashed border-[#FFDBB6] uppercase tracking-wider">
            Thông tin cá nhân
          </h4>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Ngày sinh
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.ngaysinh
                  ? new Date(detail.ngaysinh).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Giới tính
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.gioitinh || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Số điện thoại
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.sodienthoai || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Email cá nhân
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.emailcanhan || "—"}
              </span>
            </div>
            <div
              className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]"
              style={{ gridColumn: "span 2" }}
            >
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Quê quán (Hộ khẩu thường trú)
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.quequan || "—"}
              </span>
            </div>
          </div>

          {/* Section 2 */}
          <h4 className="text-sm font-bold text-primary mt-[18px] mb-2.5 pb-1 border-b border-dashed border-[#FFDBB6] uppercase tracking-wider">
            Thông tin học tập
          </h4>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Mã số sinh viên (MSSV)
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                <code>{detail.masv}</code>
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Lớp học
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.lop?.tenlop || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Email trường cấp
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.emailtruong || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Khoa trực thuộc
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.lop?.khoa?.tenkhoa || "—"}
              </span>
            </div>
            <div
              className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]"
              style={{ gridColumn: "span 2" }}
            >
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Địa chỉ tạm trú hiện tại
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.diachi || "—"}
              </span>
            </div>
          </div>

          {/* Section 3 */}
          <h4 className="text-sm font-bold text-primary mt-[18px] mb-2.5 pb-1 border-b border-dashed border-[#FFDBB6] uppercase tracking-wider">
            Giấy tờ pháp lý & Thân nhân
          </h4>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Số CCCD/CMND
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.cccd || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Cấp ngày & Nơi cấp
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.ngaycapcccd
                  ? `${new Date(detail.ngaycapcccd).toLocaleDateString("vi-VN")} `
                  : ""}
                {detail.noicapcccd
                  ? `(${detail.noicapcccd})`
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Họ tên người bảo hộ (Phụ huynh)
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.tenphuhuynh || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                SĐT liên hệ phụ huynh
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.sodienthoaiphuhuynh || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Dân tộc
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.dantoc || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Tôn giáo
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.tongiao || "—"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Lecturer Header */}
          <div className="flex items-center gap-4 pb-4 border-b-2 border-[#FFDBB6] mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FBD9D9] to-[#FFDBB6] flex items-center justify-center text-2xl font-bold text-primary border-2 border-[#FFDBB6]">
              {detail.hoten?.charAt(0) || "G"}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-[#2D1B14] m-0">
                {detail.hoten}
              </h3>
              <div className="flex gap-2 mt-1">
                <span className="badge badge-blue">Giảng viên</span>
                {detail.hocvi && (
                  <span className="badge badge-green">{detail.hocvi}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <h4 className="text-sm font-bold text-primary mt-[18px] mb-2.5 pb-1 border-b border-dashed border-[#FFDBB6] uppercase tracking-wider">
            Thông tin cá nhân
          </h4>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Ngày sinh
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.ngaysinh
                  ? new Date(detail.ngaysinh).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Giới tính
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.gioitinh || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Số điện thoại di động
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.sodienthoai || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Email cá nhân
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.emailcanhan || "—"}
              </span>
            </div>
            <div
              className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]"
              style={{ gridColumn: "span 2" }}
            >
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Địa chỉ cư trú
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.diachi || "—"}
              </span>
            </div>
          </div>

          {/* Section 2 */}
          <h4 className="text-sm font-bold text-primary mt-[18px] mb-2.5 pb-1 border-b border-dashed border-[#FFDBB6] uppercase tracking-wider">
            Học hàm học vị & Khoa
          </h4>
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Mã số giảng viên (Mã GV)
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                <code>{detail.magv}</code>
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Khoa công tác
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.khoa?.tenkhoa || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Chuyên ngành chính
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.chuyennganh || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Trình độ / Học vị
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.hocvi || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Email trường cấp
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.emailtruong || "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Ngày tiếp nhận công tác
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.ngayvaotruong
                  ? new Date(
                      detail.ngayvaotruong,
                    ).toLocaleDateString("vi-VN")
                  : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 bg-[#FEFAE3] p-[8px_12px] rounded-lg border border-[#FFDBB6]">
              <span className="text-[11px] font-semibold text-[#8B6F5F] uppercase tracking-wider">
                Hệ số lương
              </span>
              <span className="text-[13px] font-semibold text-[#2D1B14]">
                {detail.hesoluong !== undefined &&
                detail.hesoluong !== null
                  ? Number(detail.hesoluong).toFixed(2)
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
