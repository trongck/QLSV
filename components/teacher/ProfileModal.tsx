"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/auth.service";
import { useAuth } from "@/hooks/auth/useAuth";
import { User, Shield, Mail, Phone, MapPin, Award, Calendar, BookOpen, UserCheck, X, Edit3, Save } from "lucide-react";

interface ProfileData {
  magv: string;
  mataikhoan: string;
  makhoa: string;
  hodem: string;
  ten: string;
  ngaysinh: string | null;
  gioitinh: "Nam" | "Nu" | "Khac" | null;
  hocvi: string | null;
  chuyennganh: string | null;
  anhdaidien: string | null;
  emailtruong: string | null;
  thanhtuu: string | null;
  diachi: string | null;
  sodienthoai: string | null;
  emailcanhan: string | null;
  ngayvaotruong: string | null;
  hesoluong: number | null;
  hoten: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [data, setData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [hoten, setHoten] = useState("");
  const [emailcanhan, setEmailcanhan] = useState("");
  const [emailtruong, setEmailtruong] = useState("");
  const [sodienthoai, setSodienthoai] = useState("");
  const [diachi, setDiachi] = useState("");
  const [ngaysinh, setNgaysinh] = useState("");
  const [gioitinh, setGioitinh] = useState<"Nam" | "Nu" | "Khac">("Nam");
  const [hocvi, setHocvi] = useState("");
  const [chuyennganh, setChuyennganh] = useState("");
  const [thanhtuu, setThanhtuu] = useState("");
  const [anhdaidien, setAnhdaidien] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function fetchProfile() {
      setLoading(true);
      setError("");
      setIsEditing(false);
      try {
        const res = await apiFetch("/api/giangvien/profile");
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data as ProfileData;
          setData(p);
          setHoten(p.hoten || "");
          setEmailcanhan(p.emailcanhan || "");
          setEmailtruong(p.emailtruong || "");
          setSodienthoai(p.sodienthoai || "");
          setDiachi(p.diachi || "");
          setNgaysinh(p.ngaysinh ? p.ngaysinh.split("T")[0] : "");
          setGioitinh(p.gioitinh || "Nam");
          setHocvi(p.hocvi || "");
          setChuyennganh(p.chuyennganh || "");
          setThanhtuu(p.thanhtuu || "");
          setAnhdaidien(p.anhdaidien || "");
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
      const res = await apiFetch("/api/giangvien/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hoten,
          email: emailtruong,
          ngaysinh: ngaysinh || null,
          gioitinh,
          hocvi,
          chuyennganh,
          anhdaidien,
          thanhtuu,
          diachi,
          sodienthoai,
          emailcanhan,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Cập nhật thông tin hồ sơ cá nhân thành công!");
        setIsEditing(false);
        // Refresh local data state
        if (data) {
          setData({
            ...data,
            hoten,
            emailcanhan,
            emailtruong,
            sodienthoai,
            diachi,
            ngaysinh,
            gioitinh,
            hocvi,
            chuyennganh,
            thanhtuu,
            anhdaidien,
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
              <h2 className="text-lg font-bold text-[#2D1B14]">Hồ sơ cá nhân Giảng viên</h2>
              <p className="text-xs text-[#8B6F5F]">Quản lý thông tin lý lịch cá nhân và trình độ chuyên môn</p>
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
              {/* Left Column: Avatar & Basic Specs */}
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

                <h3 className="text-base font-bold text-[#2D1B14]">{hoten || "Giảng viên"}</h3>
                <span className="text-xs font-semibold text-[#8B6F5F] bg-[#FFF2EB] px-2.5 py-1 rounded-full mt-1.5 border border-[#F3E5D8]">
                  Mã GV: {data?.magv}
                </span>

                <div className="w-full mt-6 space-y-3.5 text-left border-t border-[#EAD9CB] pt-5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Khoa trực thuộc</span>
                    <span className="text-sm font-semibold text-[#2D1B14] mt-0.5 block">{data?.makhoa || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Ngày vào trường</span>
                    <span className="text-sm font-medium text-[#2D1B14] mt-0.5 block">
                      {data?.ngayvaotruong ? new Date(data.ngayvaotruong).toLocaleDateString("vi-VN") : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8B6F5F] block tracking-wider">Hệ số lương</span>
                    <span className="text-sm font-medium text-[#2D1B14] mt-0.5 block">{data?.hesoluong || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editable / View Profile Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Notifications & Status */}
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

                {/* Main Card */}
                <div className="bg-white rounded-xl border border-[#EAD9CB] p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F3E5D8]">
                    <h4 className="font-bold text-[#2D1B14] flex items-center gap-2">
                      <Shield size={16} className="text-[#C25450]" />
                      Thông tin chi tiết
                    </h4>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
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

                  {/* Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Họ tên */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        Họ và tên
                      </label>
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
                        Email trường (Tài khoản)
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={emailtruong}
                          onChange={(e) => setEmailtruong(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent select-all">
                          {emailtruong || "—"}
                        </div>
                      )}
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
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        Giới tính
                      </label>
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

                    {/* Học vị */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <BookOpen size={12} />
                        Học vị
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={hocvi}
                          onChange={(e) => setHocvi(e.target.value)}
                          placeholder="Ví dụ: Tiến sĩ, Thạc sĩ"
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {hocvi || "—"}
                        </div>
                      )}
                    </div>

                    {/* Chuyên ngành */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        Chuyên ngành
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={chuyennganh}
                          onChange={(e) => setChuyennganh(e.target.value)}
                          placeholder="Ví dụ: Khoa học máy tính"
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {chuyennganh || "—"}
                        </div>
                      )}
                    </div>

                    {/* Địa chỉ */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-[#8B6F5F] flex items-center gap-1">
                        <MapPin size={12} />
                        Địa chỉ thường trú
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={diachi}
                          onChange={(e) => setDiachi(e.target.value)}
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      ) : (
                        <div className="text-sm font-medium text-[#2D1B14] bg-[#FAF6F2] p-2 rounded-lg border border-transparent">
                          {diachi || "—"}
                        </div>
                      )}
                    </div>

                    {/* Link ảnh đại diện */}
                    {isEditing && (
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold text-[#8B6F5F]">
                          Đường dẫn ảnh đại diện (URL)
                        </label>
                        <input
                          type="text"
                          value={anhdaidien}
                          onChange={(e) => setAnhdaidien(e.target.value)}
                          placeholder="Nhập link ảnh (ví dụ: https://example.com/avatar.jpg)"
                          className="w-full text-sm p-2 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Achievements Card */}
                <div className="bg-white rounded-xl border border-[#EAD9CB] p-6 shadow-sm">
                  <h4 className="font-bold text-[#2D1B14] mb-3 flex items-center gap-2">
                    <Award size={16} className="text-[#C25450]" />
                    Thành tựu & Nghiên cứu khoa học
                  </h4>
                  {isEditing ? (
                    <textarea
                      value={thanhtuu}
                      onChange={(e) => setThanhtuu(e.target.value)}
                      rows={4}
                      placeholder="Nhập các giải thưởng, đề tài nghiên cứu khoa học hoặc thành tựu khác..."
                      className="w-full text-sm p-3 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450] resize-y"
                    />
                  ) : (
                    <div className="text-sm text-[#4A3B32] bg-[#FAF6F2] p-4 rounded-lg whitespace-pre-line leading-relaxed min-h-[80px]">
                      {thanhtuu || "Chưa cập nhật thông tin thành tựu nghiên cứu khoa học."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
