"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { VaiTro } from "@/types";
import { apiFetch } from "@/services/auth.service";
import styles from "./DashboardLayout.module.css";

// ─── Nav items per role ────────────────────────────────────────────────────────

const SV_NAV = [
  { href: "/student/dashboard", label: "Tổng quan" },
  { href: "/student/schedule",  label: "Lịch học" },
  { href: "/student/grades",    label: "Kết quả" },
  { href: "/student/tasks",     label: "Bài tập" },
  { href: "/student/messages",  label: "Tin nhắn" },
];

const GV_NAV = [
  { href: "/teacher/dashboard", label: "Tổng quan" },
  { href: "/teacher/classes",   label: "Lớp học" },
  { href: "/teacher/attendance",     label: "Điểm danh" },
  { href: "/teacher/students",  label: "Sinh viên" },
  { href: "/teacher/grades",    label: "Nhập điểm" },
  { href: "/teacher/tasks",     label: "Bài tập" },
  { href: "/teacher/exam",     label: "Thi trực tuyến" },
  { href: "/teacher/report",     label: "Báo cáo và thống kê" },
  { href: "/teacher/message",     label: "Tin nhắn" },
  { href: "/teacher/notification",     label: "Thông báo" },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard",   label: "Tổng quan" },
  { href: "/admin/students",    label: "Sinh viên" },
  { href: "/admin/teachers",    label: "Giảng viên" },
  { href: "/admin/classes",     label: "Lớp - Khoa" },
  { href: "/admin/semesters",   label: "Học kỳ" },
  { href: "/admin/subjects",    label: "Môn học" },
  { href: "/admin/notifications", label: "Thông báo" },
  { href: "/admin/accounts",    label: "Tài khoản" },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const { user, logout, updateUser } = useAuth();
  const pathname = usePathname();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("0912345678");
  const [editFaculty, setEditFaculty] = useState("Khoa Công nghệ thông tin");
  const [editAvatarColor, setEditAvatarColor] = useState("#C25450");

  const [editMaGV, setEditMaGV] = useState("");
  const [editMaTaiKhoan, setEditMaTaiKhoan] = useState("");
  const [editNgaySinh, setEditNgaySinh] = useState("");
  const [editGioiTinh, setEditGioiTinh] = useState("Nam");
  const [editHocVi, setEditHocVi] = useState("");
  const [editChuyenNganh, setEditChuyenNganh] = useState("");
  const [editAnhDaiDien, setEditAnhDaiDien] = useState("");
  const [editThanhTuu, setEditThanhTuu] = useState("");
  const [editDiaChi, setEditDiaChi] = useState("");
  const [editEmailCaNhan, setEditEmailCaNhan] = useState("");
  const [editNgayVaoTruong, setEditNgayVaoTruong] = useState("");
  const [editHeSoLuong, setEditHeSoLuong] = useState("");

  const handleOpenProfile = async () => {
    setEditName(user?.hoten ?? "");
    setEditEmail(user?.email ?? "");
    setIsProfileOpen(true);

    try {
      const res = await apiFetch("/api/giangvien/profile");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const p = json.data;
          // Trường phẳng — DB đã merge chitietgiangvien vào giangvien
          setEditMaGV(p.magv ?? "");
          setEditMaTaiKhoan(p.mataikhoan ?? "");
          setEditName(p.hoten ?? user?.hoten ?? "");
          setEditEmail(p.emailtruong ?? user?.email ?? "");
          setEditNgaySinh(p.ngaysinh ? p.ngaysinh.slice(0, 10) : "");
          setEditGioiTinh(p.gioitinh ?? "Nam");
          setEditHocVi(p.hocvi ?? "");
          setEditChuyenNganh(p.chuyennganh ?? "");
          setEditAnhDaiDien(p.anhdaidien ?? "");
          setEditThanhTuu(p.thanhtuu ?? "");
          setEditDiaChi(p.diachi ?? "");
          setEditPhone(p.sodienthoai ?? "");
          setEditEmailCaNhan(p.emailcanhan ?? "");
          setEditNgayVaoTruong(p.ngayvaotruong ? p.ngayvaotruong.slice(0, 10) : "");
          setEditHeSoLuong(p.hesoluong?.toString() ?? "");
          // Map mã khoa → tên hiển thị
          const khoaMap: Record<string, string> = {
            CNTT:  "Khoa Công nghệ thông tin",
            DTVT:  "Khoa Điện tử viễn thông",
            KTVQL: "Khoa Kinh tế và Quản lý",
            KHCB:  "Khoa Khoa học cơ bản",
          };
          if (p.makhoa) setEditFaculty(khoaMap[p.makhoa] ?? p.makhoa);
        }
      }
    } catch (err) {
      console.error("Lỗi tải hồ sơ giảng viên:", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/api/giangvien/profile", {
        method: "PUT",
        body: JSON.stringify({
          hoten:       editName,
          email:       editEmail,
          sodienthoai: editPhone,
          faculty:     editFaculty,
          ngaysinh:    editNgaySinh    || null,
          gioitinh:    editGioiTinh,
          hocvi:       editHocVi,
          chuyennganh: editChuyenNganh,
          anhdaidien:  editAnhDaiDien,
          thanhtuu:    editThanhTuu,
          diachi:      editDiaChi,
          emailcanhan: editEmailCaNhan,
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Lỗi lưu thông tin");
      }

      // Cập nhật context cục bộ để Sidebar hiển thị tên mới ngay lập tức
      updateUser?.({ hoten: editName, email: editEmail });

      alert("Đã cập nhật hồ sơ cá nhân thành công!");
      setIsProfileOpen(false);
    } catch (err: any) {
      console.error("Không thể lưu hồ sơ:", err.message);
      alert("Lỗi: " + err.message);
    }
  };

  const navItems =
    user?.vaitro === VaiTro.SinhVien  ? SV_NAV    :
    user?.vaitro === VaiTro.GiangVien ? GV_NAV    :
    ADMIN_NAV;

  const roleLabel =
    user?.vaitro === VaiTro.SinhVien  ? "Sinh viên"  :
    user?.vaitro === VaiTro.GiangVien ? "Giảng viên" :
    "Quản trị viên";

  // ⚠️ KHÔNG dùng <nav className={styles.sidebar}> ở đây nữa.
  // DashboardShell đã bọc <div className={styles.sidebar}> bên ngoài rồi —
  // nếu lồng thêm sẽ khiến class .open không hoạt động trên mobile/tablet.
  return (
    <>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3L20 8V16L12 21L4 16V8L12 3Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className={styles.logoText}>Hệ thống quản lý sinh viên</span>
      </div>

      {/* Nav */}
      <ul className={styles.navList} role="list">
        {navItems.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`sidebar-item ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
            >
              <span className={styles.navIcon} aria-hidden></span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      {/* User info + logout */}
      <div className={styles.sidebarFooter}>
        <div 
          className={styles.userInfo} 
          style={{ cursor: "pointer" }} 
          onClick={handleOpenProfile}
          title="Xem & Chỉnh sửa hồ sơ"
        >
          <div className={styles.avatar} aria-hidden>
            {user?.hoten?.charAt(0) ?? "?"}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user?.hoten ?? "—"}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={() => logout()}
          aria-label="Đăng xuất"
          title="Đăng xuất"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Backdrop-blurred Profile Edit Modal Overlay */}
      {isProfileOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "720px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            border: "1px solid #EAD9CB",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #F2A8A8 0%, #FFB4B4 100%)",
              padding: "20px",
              color: "#2D1B14",
              position: "relative"
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>Thông tin Hồ sơ Cá nhân (Đầy đủ)</h3>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.9 }}>Quản lý thông tin tài khoản và lý lịch khoa học giảng viên</p>
              <button 
                type="button"
                onClick={() => setIsProfileOpen(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#2D1B14",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} style={{ 
              padding: "20px", 
              display: "flex", 
              flexDirection: "column", 
              gap: "16px",
              maxHeight: "80vh",
              overflowY: "auto"
            }}>
              
              {/* Profile Header Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", borderBottom: "1px solid #F5EAE1", paddingBottom: "15px" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: editAvatarColor,
                  color: "white",
                  fontSize: "32px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  overflow: "hidden"
                }}>
                  {editAnhDaiDien ? (
                    <img src={editAnhDaiDien} alt={editName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    editName.charAt(0) || "?"
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#8B6F5F", textTransform: "uppercase" }}>Đường dẫn ảnh đại diện (anhdaidien)</label>
                  <input 
                    type="text" 
                    placeholder="URL hình ảnh (https://...)" 
                    value={editAnhDaiDien}
                    onChange={(e) => setEditAnhDaiDien(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13px",
                      outline: "none",
                      color: "#2D1B14",
                      width: "100%"
                    }}
                  />
                </div>
              </div>

              {/* Responsive Double Column Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px"
              }}>
                
                {/* 1. Mã giảng viên */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F" }}>MÃ GIẢNG VIÊN (MAGV)</label>
                  <input 
                    type="text" 
                    value={editMaGV}
                    disabled
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      backgroundColor: "#F5F5F5",
                      fontSize: "13.5px",
                      color: "#8B6F5F",
                      cursor: "not-allowed"
                    }}
                  />
                </div>

                {/* 2. Mã tài khoản */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F" }}>MÃ TÀI KHOẢN (MATAIKHOAN)</label>
                  <input 
                    type="text" 
                    value={editMaTaiKhoan}
                    disabled
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      backgroundColor: "#F5F5F5",
                      fontSize: "13.5px",
                      color: "#8B6F5F",
                      cursor: "not-allowed"
                    }}
                  />
                </div>

                {/* 3. Họ và tên */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>HỌ VÀ TÊN (HOTEN)</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 4. Khoa / Bộ môn */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>KHOA / BỘ MÔN (MAKHOA)</label>
                  <select 
                    value={editFaculty}
                    onChange={(e) => setEditFaculty(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  >
                    <option value="Khoa Công nghệ thông tin">Khoa Công nghệ thông tin</option>
                    <option value="Khoa Điện tử viễn thông">Khoa Điện tử viễn thông</option>
                    <option value="Khoa Kinh tế và Quản lý">Khoa Kinh tế và Quản lý</option>
                    <option value="Khoa Khoa học cơ bản">Khoa Khoa học cơ bản</option>
                  </select>
                </div>

                {/* 5. Ngày sinh */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>NGÀY SINH (NGAYSINH)</label>
                  <input 
                    type="date" 
                    value={editNgaySinh}
                    onChange={(e) => setEditNgaySinh(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 6. Giới tính */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>GIỚI TÍNH (GIOITINH)</label>
                  <select 
                    value={editGioiTinh}
                    onChange={(e) => setEditGioiTinh(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nu">Nữ</option>
                    <option value="Khac">Khác</option>
                  </select>
                </div>

                {/* 7. Học vị */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>HỌC VỊ (HOCVI)</label>
                  <input 
                    type="text" 
                    placeholder="Thạc sĩ, Tiến sĩ..." 
                    value={editHocVi}
                    onChange={(e) => setEditHocVi(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 8. Chuyên ngành */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>CHUYÊN NGÀNH (CHUYENNGANH)</label>
                  <input 
                    type="text" 
                    placeholder="Khoa học máy tính..." 
                    value={editChuyenNganh}
                    onChange={(e) => setEditChuyenNganh(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 9. Email trường */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>EMAIL TRƯỜNG (EMAILTRUONG)</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 10. Số điện thoại */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>SỐ ĐIỆN THOẠI (SODIENTHOAI)</label>
                  <input 
                    type="text" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 11. Email cá nhân */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>EMAIL CÁ NHÂN (EMAILCANHAN)</label>
                  <input 
                    type="email" 
                    value={editEmailCaNhan}
                    onChange={(e) => setEditEmailCaNhan(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 12. Địa chỉ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>ĐỊA CHỈ (DIACHI)</label>
                  <input 
                    type="text" 
                    value={editDiaChi}
                    onChange={(e) => setEditDiaChi(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      fontSize: "13.5px",
                      outline: "none",
                      color: "#2D1B14"
                    }}
                  />
                </div>

                {/* 13. Ngày vào trường */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F" }}>NGÀY VÀO TRƯỜNG (NGAYVAOTRUONG)</label>
                  <input 
                    type="date" 
                    value={editNgayVaoTruong}
                    disabled
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      backgroundColor: "#F5F5F5",
                      fontSize: "13.5px",
                      color: "#8B6F5F",
                      cursor: "not-allowed"
                    }}
                  />
                </div>

                {/* 14. Hệ số lương */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#8B6F5F" }}>HỆ SỐ LƯƠNG (HESOLUONG)</label>
                  <input 
                    type="text" 
                    value={editHeSoLuong}
                    disabled
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #EAD9CB",
                      backgroundColor: "#F5F5F5",
                      fontSize: "13.5px",
                      color: "#8B6F5F",
                      cursor: "not-allowed"
                    }}
                  />
                </div>

              </div>

              {/* 15. Thành tựu */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#6B4F3F" }}>THÀNH TỰU (THANHTUU)</label>
                <textarea 
                  value={editThanhTuu}
                  onChange={(e) => setEditThanhTuu(e.target.value)}
                  placeholder="Danh sách bài báo nghiên cứu, giải thưởng, thành tựu học thuật..."
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    fontSize: "13.5px",
                    outline: "none",
                    color: "#2D1B14",
                    height: "80px",
                    resize: "none"
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", borderTop: "1px solid #F5EAE1", paddingTop: "15px" }}>
                <button 
                  type="button" 
                  onClick={() => setIsProfileOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #EAD9CB",
                    background: "white",
                    color: "#6B4F3F",
                    fontSize: "13.5px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(90deg, #F2A8A8 0%, #FFB4B4 100%)",
                    color: "white",
                    fontSize: "13.5px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(242, 168, 168, 0.4)"
                  }}
                >
                  Lưu thay đổi
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Top bar (mobile hamburger) ────────────────────────────────────────────────

export function DashboardTopbar({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <header className={styles.topbar}>
      <button
        className={styles.menuBtn}
        onClick={onMenuClick}
        data-menu-btn
        aria-label="Mở menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <h1 className={styles.topbarTitle}>{title}</h1>
      <div className={styles.topbarRight}>
        <div className={styles.avatarSm} aria-label={`Xin chào, ${user?.hoten}`}>
          {user?.hoten?.charAt(0) ?? "?"}
        </div>
        <button className={styles.logoutBtnSm} onClick={() => logout()} aria-label="Đăng xuất">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}