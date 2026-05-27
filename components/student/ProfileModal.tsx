"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { useAuth } from "@/hooks/auth/useAuth";
import { User, Shield, Mail, Phone, MapPin, Award, Calendar, BookOpen, UserCheck, X, Edit3, Save, Heart, CreditCard, ScanFace, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const FaceRegistrationModal = dynamic(
  () => import("./FaceRegistrationModal").then((mod) => mod.FaceRegistrationModal),
  { ssr: false }
);
interface ProfileData {
  masv: string;
  mataikhoan: string;
  malop: string;
  hodem: string;
  ten: string;
  ngaysinh: string | null;
  gioitinh: "Nam" | "Nu" | "Khac" | null;
  anhdaidien: string | null;
  emailtruong: string | null;
  trangthai: string | null;
  diachithuongtru: string | null;
  diachitamtru: string | null;
  sodienthoai: string | null;
  emailcanhan: string | null;
  tenphuhuynh: string | null;
  sodienthoaiphuhuynh: string | null;
  cccd: string | null;
  ngaycapcccd: string | null;
  noicapcccd: string | null;
  dantoc: string | null;
  tongiao: string | null;
  face_embedding: string | null;
  hoten: string;
  lop: {
    tenlop: string;
    nganh: string;
    khoahoc: string;
  };
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [data, setData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [faceScanOpen, setFaceScanOpen] = useState(false);

  // Form states
  const [hoten, setHoten] = useState("");
  const [emailcanhan, setEmailcanhan] = useState("");
  const [sodienthoai, setSodienthoai] = useState("");
  const [diachitamtru, setDiachitamtru] = useState("");
  const [ngaysinh, setNgaysinh] = useState("");
  const [gioitinh, setGioitinh] = useState<"Nam" | "Nu" | "Khac">("Nam");
  const [anhdaidien, setAnhdaidien] = useState("");
  const [diachithuongtru, setDiachithuongtru] = useState("");
  const [tenphuhuynh, setTenphuhuynh] = useState("");
  const [sodienthoaiphuhuynh, setSodienthoaiphuhuynh] = useState("");
  const [cccd, setCccd] = useState("");
  const [ngaycapcccd, setNgaycapcccd] = useState("");
  const [noicapcccd, setNoicapcccd] = useState("");
  const [dantoc, setDantoc] = useState("");
  const [tongiao, setTongiao] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function fetchProfile() {
      setLoading(true);
      setError("");
      setSuccessMsg("");
      setIsEditing(false);
      try {
        const res = await apiFetch("/api/student/profile");
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data as ProfileData;
          setData(p);
          setHoten(p.hoten || "");
          setEmailcanhan(p.emailcanhan || "");
          setSodienthoai(p.sodienthoai || "");
          setDiachitamtru(p.diachitamtru || "");
          setNgaysinh(p.ngaysinh ? p.ngaysinh.split("T")[0] : "");
          setGioitinh(p.gioitinh || "Nam");
          setAnhdaidien(p.anhdaidien || "");
          setDiachithuongtru(p.diachithuongtru || "");
          setTenphuhuynh(p.tenphuhuynh || "");
          setSodienthoaiphuhuynh(p.sodienthoaiphuhuynh || "");
          setCccd(p.cccd || "");
          setNgaycapcccd(p.ngaycapcccd ? p.ngaycapcccd.split("T")[0] : "");
          setNoicapcccd(p.noicapcccd || "");
          setDantoc(p.dantoc || "");
          setTongiao(p.tongiao || "");
        } else {
          setError(json.error || "Không thể lấy thông tin hồ sơ");
        }
      } catch (err: any) {
        setError("Lỗi máy chủ khi tải thông tin hồ sơ");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiFetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoten,
          ngaysinh: ngaysinh || null,
          gioitinh,
          anhdaidien,
          diachithuongtru,
          diachitamtru,
          sodienthoai,
          emailcanhan,
          tenphuhuynh,
          sodienthoaiphuhuynh,
          cccd,
          ngaycapcccd: ngaycapcccd || null,
          noicapcccd,
          dantoc,
          tongiao,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Cập nhật thông tin hồ sơ cá nhân thành công!");
        setIsEditing(false);
        if (data) {
          setData({
            ...data,
            hoten,
            emailcanhan,
            sodienthoai,
            diachitamtru,
            ngaysinh,
            gioitinh,
            anhdaidien,
            diachithuongtru,
            tenphuhuynh,
            sodienthoaiphuhuynh,
            cccd,
            ngaycapcccd,
            noicapcccd,
            dantoc,
            tongiao,
          });
        }
      } else {
        setError(json.error || "Cập nhật thất bại");
      }
    } catch (err: any) {
      setError("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayGioiTinh = (val: string | null) => {
    if (val === "Nu" || val === "Nữ") return "Nữ";
    if (val === "Nam") return "Nam";
    return "Khác";
  };

  const displayTrangThai = (val: string | null) => {
    if (val === "Danghoc") return "Đang học";
    if (val === "Baoluu") return "Bảo lưu";
    if (val === "Thoihoc") return "Thôi học";
    if (val === "Totnghiep") return "Tốt nghiệp";
    return val || "—";
  };

  return (
    <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[999] flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-[850px] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAD9CB] flex justify-between items-center bg-[#FFF2EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C25450] rounded-xl text-white">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D1B14]">Hồ sơ cá nhân Sinh viên</h2>
              <p className="text-xs text-[#8B6F5F]">Quản lý lý lịch cá nhân và thông tin học tập của bạn</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#F3E5D8] rounded-full text-[#8B6F5F] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF6F2]">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#C25450] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#8B6F5F] font-medium">Đang tải thông tin hồ sơ...</p>
            </div>
          ) : error && !data ? (
            <div className="py-12 text-center">
              <p className="text-red-600 font-medium mb-3">{error}</p>
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-[#8B6F5F] text-white rounded-lg text-sm hover:bg-[#6B4F3F]"
              >
                Đóng
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Avatar & Fixed Academic Specs */}
              <div className="md:col-span-1 flex flex-col items-center text-center p-5 bg-white rounded-xl border border-[#EAD9CB] h-fit shadow-sm">
                <div className="relative group mb-4">
                  {anhdaidien ? (
                    <img 
                      src={anhdaidien} 
                      alt={hoten} 
                      className="w-28 h-28 rounded-full object-cover border-4 border-[#FFF2EB] shadow-md"
                      onError={() => setAnhdaidien("")}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#C25450] text-white text-3xl font-bold flex items-center justify-center border-4 border-[#FFF2EB] shadow-md">
                      {hoten?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-[#2D1B14]">{hoten || "Sinh viên"}</h3>
                <span className="text-xs font-semibold text-[#8B6F5F] bg-[#FFF2EB] px-2.5 py-1 rounded-full mt-1.5 border border-[#F3E5D8]">
                  MSSV: {data?.masv}
                </span>

                <div className="w-full mt-6 space-y-3.5 text-left border-t border-[#EAD9CB] pt-5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Lớp hành chính</span>
                    <span className="text-sm font-semibold text-[#2D1B14] mt-0.5 block">{data?.lop?.tenlop || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Ngành học</span>
                    <span className="text-sm font-medium text-[#2D1B14] mt-0.5 block">{data?.lop?.nganh || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Trạng thái học tập</span>
                    <span className="text-xs font-semibold text-[#C25450] bg-[#FFF2EB] px-2 py-0.5 rounded border border-[#F3E5D8] mt-1 inline-block">
                      {displayTrangThai(data?.trangthai || "")}
                    </span>
                  </div>
                  
                  {/* Khuôn mặt điểm danh */}
                  <div className="pt-4 border-t border-[#EAD9CB] mt-4">
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider mb-2">Dữ liệu khuôn mặt</span>
                    {data?.face_embedding ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200 mb-3">
                        <ScanFace size={16} />
                        <span className="text-xs font-semibold">Đã đăng ký</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-3">
                        <AlertCircle size={16} />
                        <span className="text-xs font-semibold">Chưa đăng ký</span>
                      </div>
                    )}
                    <button
                      onClick={() => setFaceScanOpen(true)}
                      className="w-full bg-[#FFF2EB] hover:bg-[#F3E5D8] text-[#C25450] font-semibold text-xs py-2 rounded-lg border border-[#EAD9CB] transition flex items-center justify-center gap-1.5"
                    >
                      <ScanFace size={14} />
                      {data?.face_embedding ? "Cập nhật khuôn mặt" : "Đăng ký khuôn mặt"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Editable Profile Details */}
              <div className="md:col-span-2 space-y-6">
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-800 text-sm font-medium rounded-lg border border-green-200">
                    {successMsg}
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-red-50 text-red-800 text-sm font-medium rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                {/* Information Sections */}
                <div className="bg-white rounded-xl border border-[#EAD9CB] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F3E5D8]">
                    <h4 className="font-bold text-[#2D1B14] flex items-center gap-2">
                      <Shield size={16} className="text-[#C25450]" />
                      Thông tin cơ bản
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setSuccessMsg("");
                        }}
                        className="btn-secondary flex items-center gap-1.5 text-xs py-1 px-3"
                      >
                        <Edit3 size={13} />
                        Chỉnh sửa
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn-secondary text-xs py-1 px-3 border border-[#EAD9CB]"
                          disabled={saving}
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSave}
                          className="btn-primary flex items-center gap-1.5 text-xs py-1 px-3 bg-[#C25450] hover:bg-[#A9433F] text-white"
                          disabled={saving}
                        >
                          <Save size={13} />
                          {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Basic Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ tên */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Họ và tên</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={hoten}
                          onChange={(e) => setHoten(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {hoten || "—"}
                        </div>
                      )}
                    </div>

                    {/* Email trường */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <Mail size={12} />
                        Email trường (Cố định)
                      </label>
                      <div className="text-sm font-medium text-[#8B6F5F] bg-[#FAF6F2] p-2 rounded-lg border border-transparent select-all">
                        {data?.emailtruong || "—"}
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <Phone size={12} />
                        Số điện thoại
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={sodienthoai}
                          onChange={(e) => setSodienthoai(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {sodienthoai || "—"}
                        </div>
                      )}
                    </div>

                    {/* Email cá nhân */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <Mail size={12} />
                        Email cá nhân
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={emailcanhan}
                          onChange={(e) => setEmailcanhan(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {emailcanhan || "—"}
                        </div>
                      )}
                    </div>

                    {/* Ngày sinh */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <Calendar size={12} />
                        Ngày sinh
                      </label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={ngaysinh}
                          onChange={(e) => setNgaysinh(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {ngaysinh ? new Date(ngaysinh).toLocaleDateString("vi-VN") : "—"}
                        </div>
                      )}
                    </div>

                    {/* Giới tính */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Giới tính</label>
                      {isEditing ? (
                        <select
                          value={gioitinh}
                          onChange={(e) => setGioitinh(e.target.value as any)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nu">Nữ</option>
                          <option value="Khac">Khác</option>
                        </select>
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {displayGioiTinh(gioitinh)}
                        </div>
                      )}
                    </div>

                    {/* Địa chỉ thường trú */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Địa chỉ thường trú</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={diachithuongtru}
                          onChange={(e) => setDiachithuongtru(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {diachithuongtru || "—"}
                        </div>
                      )}
                    </div>

                    {/* Dân tộc & Tôn giáo */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8B6F5F]">Dân tộc</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={dantoc}
                            onChange={(e) => setDantoc(e.target.value)}
                            className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                          />
                        ) : (
                          <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                            {dantoc || "—"}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[#8B6F5F]">Tôn giáo</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={tongiao}
                            onChange={(e) => setTongiao(e.target.value)}
                            className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                          />
                        ) : (
                          <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                            {tongiao || "—"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Địa chỉ tạm trú */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <MapPin size={12} />
                        Địa chỉ tạm trú
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={diachitamtru}
                          onChange={(e) => setDiachitamtru(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {diachitamtru || "—"}
                        </div>
                      )}
                    </div>

                    {/* Link ảnh đại diện */}
                    {isEditing && (
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-[#8B6F5F]">Đường dẫn ảnh đại diện (URL)</label>
                        <input
                          type="text"
                          value={anhdaidien}
                          onChange={(e) => setAnhdaidien(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CCCD Info */}
                <div className="bg-white rounded-xl border border-[#EAD9CB] p-6 shadow-sm">
                  <h4 className="font-bold text-[#2D1B14] mb-4 pb-2 border-b border-[#F3E5D8] flex items-center gap-2">
                    <CreditCard size={16} className="text-[#C25450]" />
                    Căn cước công dân
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Số CCCD</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={cccd}
                          onChange={(e) => setCccd(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {cccd || "—"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Ngày cấp</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={ngaycapcccd}
                          onChange={(e) => setNgaycapcccd(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {ngaycapcccd ? new Date(ngaycapcccd).toLocaleDateString("vi-VN") : "—"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Nơi cấp</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={noicapcccd}
                          onChange={(e) => setNoicapcccd(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {noicapcccd || "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Family Info */}
                <div className="bg-white rounded-xl border border-[#EAD9CB] p-6 shadow-sm">
                  <h4 className="font-bold text-[#2D1B14] mb-4 pb-2 border-b border-[#F3E5D8] flex items-center gap-2">
                    <Heart size={16} className="text-[#C25450]" />
                    Thông tin gia đình (Phụ huynh)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Họ tên phụ huynh</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={tenphuhuynh}
                          onChange={(e) => setTenphuhuynh(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {tenphuhuynh || "—"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F]">Số điện thoại phụ huynh</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={sodienthoaiphuhuynh}
                          onChange={(e) => setSodienthoaiphuhuynh(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {sodienthoaiphuhuynh || "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal đăng ký khuôn mặt */}
      <FaceRegistrationModal 
        isOpen={faceScanOpen} 
        onClose={() => setFaceScanOpen(false)} 
        onSuccess={() => {
          // Re-fetch profile to update face_embedding status
          const fetchProfile = async () => {
            try {
              const res = await apiFetch("/api/student/profile");
              const json = await res.json();
              if (json.success && json.data) {
                setData(json.data as ProfileData);
              }
            } catch (err) {}
          };
          fetchProfile();
        }}
      />
    </div>
  );
}
