"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";
import { User, Shield, Mail, X, Edit3, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface AdminProfileData {
  maadmin: string;
  mataikhoan: string;
  hoten: string;
  email: string;
  vaitro: string;
}

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminProfileModal({ isOpen, onClose }: AdminProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [data, setData] = useState<AdminProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [hoten, setHoten] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    async function fetchProfile() {
      setLoading(true);
      setError("");
      setIsEditing(false);
      try {
        const res = await apiFetch("/api/admin/profile");
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data as AdminProfileData;
          setData(p);
          setHoten(p.hoten || "");
        } else {
          setError(json.error || "Không thể lấy thông tin hồ sơ Admin.");
        }
      } catch (err: any) {
        setError("Lỗi kết nối máy chủ khi tải thông tin hồ sơ Admin.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [isOpen]);

  const handleSave = async () => {
    if (!hoten.trim()) {
      setError("Họ và tên không được để trống.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiFetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hoten }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg("Cập nhật thông tin hồ sơ cá nhân thành công!");
        setIsEditing(false);
        if (data) {
          setData({
            ...data,
            hoten: hoten.trim(),
          });
        }
      } else {
        setError(json.error || "Cập nhật hồ sơ thất bại.");
      }
    } catch (err: any) {
      setError("Lỗi máy chủ khi cập nhật hồ sơ Admin.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2D1B14]/40 backdrop-blur-[4px] z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-[650px] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(76,38,24,0.15)] border border-[#EAD9CB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#EAD9CB] flex justify-between items-center bg-[#FFF2EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#C25450] rounded-xl text-white">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2D1B14]">Hồ sơ cá nhân Admin</h2>
              <p className="text-xs text-[#8B6F5F]">Quản lý thông tin tài khoản quản trị hệ thống</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-[#F3E5D8] rounded-full text-[#8B6F5F] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-[#FAF6F2] space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 border-4 border-[#C25450] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#8B6F5F] font-bold">Đang tải hồ sơ Admin...</p>
            </div>
          ) : error && !data ? (
            <div className="py-10 text-center">
              <p className="text-red-600 text-xs font-semibold mb-3">{error}</p>
              <button 
                onClick={onClose} 
                className="px-4 py-2 bg-[#8B6F5F] text-white rounded-lg text-xs font-bold hover:bg-[#6B4F3F]"
              >
                Đóng
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Notifications */}
              {successMsg && (
                <div className="p-3 bg-green-50 text-green-800 text-xs font-semibold rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}
              {error && (
                <div className="p-3 bg-red-50 text-red-800 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {/* Profile Card Summary */}
              <div className="bg-white rounded-xl border border-[#EAD9CB] p-5 flex items-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-[#C25450] text-white text-xl font-bold flex items-center justify-center border-2 border-[#FFF2EB] shadow">
                  {data?.hoten?.charAt(0) || "A"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2D1B14]">{data?.hoten}</h3>
                  <span className="text-[10px] font-bold text-[#C25450] bg-[#FFF2EB] border border-[#F3E5D8] px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                    Quản trị viên
                  </span>
                </div>
              </div>

              {/* Main Fields Form */}
              <div className="bg-white rounded-xl border border-[#EAD9CB] p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#F3E5D8]">
                  <h4 className="font-bold text-[#2D1B14] text-xs flex items-center gap-1.5">
                    <Shield size={14} className="text-[#C25450]" />
                    Thông tin tài khoản
                  </h4>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-[#C25450] hover:text-[#A9433F] font-bold text-xs flex items-center gap-1 bg-[#FFF2EB] hover:bg-[#FBEBEB] border border-[#F5D5D5] px-2.5 py-1 rounded-lg transition-all"
                    >
                      <Edit3 size={12} />
                      Sửa hồ sơ
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-gray-500 hover:text-gray-700 font-bold text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-all"
                        disabled={saving}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        className="text-white bg-[#C25450] hover:bg-[#A9433F] font-bold text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg shadow-sm transition-all"
                        disabled={saving}
                      >
                        <Save size={12} />
                        Lưu
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mã Admin */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8B6F5F] block uppercase tracking-wider">Mã Admin</label>
                    <div className="text-xs font-semibold text-[#2D1B14] bg-[#FAF6F2] p-2.5 rounded-lg border border-transparent">
                      {data?.maadmin || "—"}
                    </div>
                  </div>

                  {/* Vai trò */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8B6F5F] block uppercase tracking-wider">Vai trò hệ thống</label>
                    <div className="text-xs font-semibold text-[#2D1B14] bg-[#FAF6F2] p-2.5 rounded-lg border border-transparent">
                      Quản trị viên cấp cao
                    </div>
                  </div>

                  {/* Họ và tên */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#8B6F5F] block uppercase tracking-wider">Họ và tên hiển thị</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={hoten}
                        onChange={(e) => setHoten(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-[#EAD9CB] bg-white text-[#2D1B14] focus:outline-none focus:border-[#C25450] font-medium"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-[#2D1B14] bg-[#FAF6F2] p-2.5 rounded-lg border border-transparent">
                        {data?.hoten || "—"}
                      </div>
                    )}
                  </div>

                  {/* Email tài khoản */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-[#8B6F5F] block uppercase tracking-wider flex items-center gap-1">
                      <Mail size={11} />
                      Email đăng nhập
                    </label>
                    <div className="text-xs font-semibold text-[#2D1B14] bg-[#FAF6F2] p-2.5 rounded-lg border border-transparent select-all">
                      {data?.email || "—"}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
