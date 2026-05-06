"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hook/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import {
  Pagination,
  SearchBar,
  TableSkeleton,
  EmptyState,
  ConfirmDelete,
} from "@/components/admin/AdminTable";
import {
  getGiangVien,
  getGiangVienById,
  createGiangVien,
  updateGiangVien,
  deleteGiangVien,
  getKhoa,
  getHocky,
  getMonhoc,
  getLop,
  getPhanCongPaginated,
  createPhanCong,
  deletePhanCong,
  type GiangVienRow,
  type KhoaRow,
  type HockyRow,
  type MonhocRow,
  type LopRow,
  type PhanCongRow,
} from "@/services/admin.service";
import { VaiTro } from "@/types";
import styles from "./teachers.module.css";

import {
  validateGiangVienCreate,
  validateGiangVienUpdate,
  firstError,
} from "@/lib/validation/admin.validation";

const HOCVI_LIST = ["Cử nhân", "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"];

// ─── Create Form ──────────────────────────────────────────────────────────────

function CreateForm({
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    magv: "",
    makhoa: "",
    hoten: "",
    ngaysinh: "",
    gioitinh: "",
    hocvi: "",
    chuyennganh: "",
    emailtruong: "",
    email: "",
    matkhau: "",
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã giảng viên *</label>
          <input
            value={form.magv}
            onChange={set("magv")}
            placeholder="VD: GV001"
          />
        </div>
        <div className="field">
          <label>Khoa</label>
          <select value={form.makhoa} onChange={set("makhoa")}>
            <option value="">-- Chọn khoa --</option>
            {khoas.map((k) => (
              <option key={k.makhoa} value={k.makhoa}>
                {k.tenkhoa}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Họ và tên *</label>
          <input
            value={form.hoten}
            onChange={set("hoten")}
            placeholder="Nguyễn Văn B"
          />
        </div>
        <div className="field">
          <label>Ngày sinh</label>
          <input type="date" value={form.ngaysinh} onChange={set("ngaysinh")} />
        </div>
        <div className="field">
          <label>Giới tính</label>
          <select value={form.gioitinh} onChange={set("gioitinh")}>
            <option value="">-- Chọn --</option>
            <option value="Nam">Nam</option>
            <option value="Nu">Nữ</option>
            <option value="Khac">Khác</option>
          </select>
        </div>
        <div className="field">
          <label>Học vị</label>
          <select value={form.hocvi} onChange={set("hocvi")}>
            <option value="">-- Chọn --</option>
            {HOCVI_LIST.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Chuyên ngành</label>
          <input
            value={form.chuyennganh}
            onChange={set("chuyennganh")}
            placeholder="VD: Trí tuệ nhân tạo"
          />
        </div>
        <div className="field full">
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
            placeholder="gv@truong.edu.vn"
          />
        </div>
        <div className="field">
          <label>Email đăng nhập *</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="email@gmail.com"
          />
        </div>
        <div className="field">
          <label>Mật khẩu *</label>
          <input
            type="password"
            value={form.matkhau}
            onChange={set("matkhau")}
            placeholder="••••••••"
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(form)}
          disabled={loading}
        >
          {loading ? "Đang lưu…" : "Tạo giảng viên"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: {
  initial: GiangVienRow;
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const [form, setForm] = useState({
    hoten: initial.hoten,
    makhoa: initial.makhoa ?? "",
    ngaysinh: initial.ngaysinh?.slice(0, 10) ?? "",
    gioitinh: initial.gioitinh ?? "",
    hocvi: initial.hocvi ?? "",
    chuyennganh: initial.chuyennganh ?? "",
    emailtruong: initial.emailtruong ?? "",
  });

  const set =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Họ và tên *</label>
          <input value={form.hoten} onChange={set("hoten")} />
        </div>
        <div className="field">
          <label>Khoa</label>
          <select value={form.makhoa} onChange={set("makhoa")}>
            <option value="">-- Chọn khoa --</option>
            {khoas.map((k) => (
              <option key={k.makhoa} value={k.makhoa}>
                {k.tenkhoa}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Học vị</label>
          <select value={form.hocvi} onChange={set("hocvi")}>
            <option value="">-- Chọn --</option>
            {HOCVI_LIST.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ngày sinh</label>
          <input type="date" value={form.ngaysinh} onChange={set("ngaysinh")} />
        </div>
        <div className="field">
          <label>Giới tính</label>
          <select value={form.gioitinh} onChange={set("gioitinh")}>
            <option value="">-- Chọn --</option>
            <option value="Nam">Nam</option>
            <option value="Nu">Nữ</option>
            <option value="Khac">Khác</option>
          </select>
        </div>
        <div className="field full">
          <label>Chuyên ngành</label>
          <input value={form.chuyennganh} onChange={set("chuyennganh")} />
        </div>
        <div className="field full">
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={() => onSubmit(form)}
          disabled={loading}
        >
          {loading ? "Đang lưu…" : "Cập nhật"}
        </button>
      </div>
    </>
  );
}

// ─── Teacher Detail & Quick Assignment Tab Modal ──────────────────────────────

function TeacherDetailModal({
  item,
  khoas,
  onClose,
}: {
  item: GiangVienRow;
  khoas: KhoaRow[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "schedule">("profile");

  // ── Tab 1: Profile State & Loading ──
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorDetail, setErrorDetail] = useState("");
  const [successDetail, setSuccessDetail] = useState("");

  const [form, setForm] = useState({
    hoten: "",
    makhoa: "",
    hocvi: "",
    chuyennganh: "",
    emailtruong: "",
    ngaysinh: "",
    gioitinh: "",
    // chi tiet giang vien
    sodienthoai: "",
    emailcanhan: "",
    ngayvaotruong: "",
    hesoluong: "",
  });

  // ── Tab 2: Schedules & Assignments State ──
  const [assignments, setAssignments] = useState<PhanCongRow[]>([]);
  const [loadingPc, setLoadingPc] = useState(false);
  const [semesters, setSemesters] = useState<HockyRow[]>([]);
  const [selectedSem, setSelectedSem] = useState<string>("");
  const [errorPc, setErrorPc] = useState("");

  // Inline Quick Assignment Form State
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [subjects, setSubjects] = useState<MonhocRow[]>([]);
  const [classes, setClasses] = useState<LopRow[]>([]);
  const [quickForm, setQuickForm] = useState({
    mamon: "",
    malop: "",
    malophoc: "",
    sisomax: "50",
    danghieuluc: true,
  });
  const [savingPc, setSavingPc] = useState(false);

  // Load detailed profile
  useEffect(() => {
    async function load() {
      setLoadingDetail(true);
      setErrorDetail("");
      try {
        const data = await getGiangVienById(item.magv);
        setDetail(data);
        setForm({
          hoten: data.hoten || "",
          makhoa: data.makhoa || "",
          hocvi: data.hocvi || "",
          chuyennganh: data.chuyennganh || "",
          emailtruong: data.emailtruong || "",
          ngaysinh: data.ngaysinh ? data.ngaysinh.slice(0, 10) : "",
          gioitinh: data.gioitinh || "",
          sodienthoai: data.chitietgiangvien?.sodienthoai || "",
          emailcanhan: data.chitietgiangvien?.emailcanhan || "",
          ngayvaotruong: data.chitietgiangvien?.ngayvaotruong ? data.chitietgiangvien.ngayvaotruong.slice(0, 10) : "",
          hesoluong: data.chitietgiangvien?.hesoluong !== undefined && data.chitietgiangvien?.hesoluong !== null ? String(data.chitietgiangvien.hesoluong) : "",
        });
      } catch (err) {
        setErrorDetail(err instanceof Error ? err.message : "Không thể tải chi tiết giảng viên.");
      } finally {
        setLoadingDetail(false);
      }
    }
    load();
  }, [item.magv]);

  // Load semesters
  useEffect(() => {
    getHocky()
      .then((res) => {
        setSemesters(res.data);
        // Find active semester
        const active = res.data.find((h) => h.danghieuluc);
        if (active) setSelectedSem(String(active.mahocky));
        else if (res.data.length > 0) setSelectedSem(String(res.data[0].mahocky));
      })
      .catch(() => {});
  }, []);

  // Load assignments when selectedSem or activeTab changes
  const loadAssignments = useCallback(async () => {
    if (!selectedSem || activeTab !== "schedule") return;
    setLoadingPc(true);
    setErrorPc("");
    try {
      const res = await getPhanCongPaginated({
        magv: item.magv,
        mahocky: selectedSem,
        limit: 100,
      });
      setAssignments(res.data);
    } catch (err) {
      setErrorPc("Lỗi tải phân công.");
    } finally {
      setLoadingPc(false);
    }
  }, [item.magv, selectedSem, activeTab]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  // Fetch subjects & classes for quick form
  useEffect(() => {
    if (showQuickForm) {
      getMonhoc({ limit: 100 })
        .then((res) => setSubjects(res.data))
        .catch(() => {});
      getLop({ limit: 100 })
        .then((res) => setClasses(res.data))
        .catch(() => {});
    }
  }, [showQuickForm]);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setErrorDetail("");
    setSuccessDetail("");
    try {
      const gvPayload = {
        hoten: form.hoten,
        makhoa: form.makhoa || null,
        hocvi: form.hocvi || null,
        chuyennganh: form.chuyennganh || null,
        emailtruong: form.emailtruong || null,
        ngaysinh: form.ngaysinh || null,
        gioitinh: form.gioitinh || null,
        chiTiet: {
          sodienthoai: form.sodienthoai || null,
          emailcanhan: form.emailcanhan || null,
          ngayvaotruong: form.ngayvaotruong || null,
          hesoluong: form.hesoluong ? parseFloat(form.hesoluong) : null,
        }
      };
      await updateGiangVien(item.magv, gvPayload);
      setSuccessDetail("Cập nhật thông tin giảng viên thành công!");
      setEditing(false);
      // Reload detail
      const updated = await getGiangVienById(item.magv);
      setDetail(updated);
    } catch (err) {
      setErrorDetail(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePc = async () => {
    if (!quickForm.mamon || !quickForm.malop) {
      alert("Vui lòng chọn môn học và lớp học.");
      return;
    }
    setSavingPc(true);
    setErrorPc("");
    try {
      await createPhanCong({
        magv: item.magv,
        mamon: quickForm.mamon,
        malop: quickForm.malop,
        mahocky: parseInt(selectedSem),
        malophoc: quickForm.malophoc || null,
        sisomax: quickForm.sisomax ? parseInt(quickForm.sisomax) : 50,
        danghieuluc: quickForm.danghieuluc,
      });
      setQuickForm({
        mamon: "",
        malop: "",
        malophoc: "",
        sisomax: "50",
        danghieuluc: true,
      });
      setShowQuickForm(false);
      await loadAssignments();
    } catch (err) {
      setErrorPc(err instanceof Error ? err.message : "Không thể tạo phân công.");
    } finally {
      setSavingPc(false);
    }
  };

  const handleDeletePc = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá phân công giảng dạy này?")) return;
    try {
      await deletePhanCong(id);
      await loadAssignments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không thể xoá.");
    }
  };

  return (
    <div>
      {/* Detail Header */}
      <div className={styles.detailHeader}>
        <div className={styles.avatar}>
          {item.hoten ? item.hoten.charAt(0).toUpperCase() : "G"}
        </div>
        <div className={styles.meta}>
          <h3 className={styles.name}>{detail?.hoten || item.hoten}</h3>
          <div className={styles.codeBadge}>
            <span className="badge badge-blue">Giảng viên</span>
            <code>Mã GV: {item.magv}</code>
            {detail?.taikhoan && (
              <span className={`badge ${detail.taikhoan.trangthai === "HoatDong" ? "badge-green" : "badge-red"}`}>
                Tài khoản: {detail.taikhoan.trangthai === "HoatDong" ? "Hoạt động" : "Đã khoá"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabBtn} ${activeTab === "profile" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("profile")}
        >
           Thông tin cá nhân & Công tác
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "schedule" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
           Phân công giảng dạy & Lịch dạy
        </button>
      </div>

      {/* ─── TAB 1: PROFILE ─── */}
      {activeTab === "profile" && (
        <div>
          {loadingDetail ? (
            <p className="empty-msg" style={{ textAlign: "center", padding: 20 }}>Đang tải dữ liệu hồ sơ…</p>
          ) : (
            <>
              {errorDetail && <div className="error-msg">{errorDetail}</div>}
              {successDetail && <div className={styles.successMsg}>{successDetail}</div>}

              <div className={styles.infoGrid}>
                {/* Basic Section */}
                <div className={styles.fullWidth}>
                  <h4 className={styles.sectionTitle}>Thông tin học thuật & khoa</h4>
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Họ và tên</span>
                  {editing ? (
                    <input className={styles.inputField} value={form.hoten} onChange={setF("hoten")} />
                  ) : (
                    <span className={styles.value}>{detail?.hoten || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Khoa công tác</span>
                  {editing ? (
                    <select className={styles.inputField} value={form.makhoa} onChange={setF("makhoa")}>
                      <option value="">-- Chọn khoa --</option>
                      {khoas.map((k) => (
                        <option key={k.makhoa} value={k.makhoa}>{k.tenkhoa}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={styles.value}>{detail?.khoa?.tenkhoa || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Học vị / Học hàm</span>
                  {editing ? (
                    <select className={styles.inputField} value={form.hocvi} onChange={setF("hocvi")}>
                      <option value="">-- Chọn --</option>
                      {HOCVI_LIST.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={styles.value}>{detail?.hocvi ? <span className="badge badge-blue">{detail.hocvi}</span> : "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Chuyên ngành</span>
                  {editing ? (
                    <input className={styles.inputField} value={form.chuyennganh} onChange={setF("chuyennganh")} />
                  ) : (
                    <span className={styles.value}>{detail?.chuyennganh || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Email trường cấp</span>
                  {editing ? (
                    <input className={styles.inputField} type="email" value={form.emailtruong} onChange={setF("emailtruong")} />
                  ) : (
                    <span className={styles.value}>{detail?.emailtruong || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Ngày sinh</span>
                  {editing ? (
                    <input className={styles.inputField} type="date" value={form.ngaysinh} onChange={setF("ngaysinh")} />
                  ) : (
                    <span className={styles.value}>{detail?.ngaysinh ? new Date(detail.ngaysinh).toLocaleDateString("vi-VN") : "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Giới tính</span>
                  {editing ? (
                    <select className={styles.inputField} value={form.gioitinh} onChange={setF("gioitinh")}>
                      <option value="">-- Chọn --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nu">Nữ</option>
                      <option value="Khac">Khác</option>
                    </select>
                  ) : (
                    <span className={styles.value}>{detail?.gioitinh || "—"}</span>
                  )}
                </div>

                {/* Extended Contact & Work Section */}
                <div className={styles.fullWidth}>
                  <h4 className={styles.sectionTitle}>Thông tin liên hệ & công tác mở rộng</h4>
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Số điện thoại di động</span>
                  {editing ? (
                    <input className={styles.inputField} value={form.sodienthoai} onChange={setF("sodienthoai")} placeholder="VD: 0987654321" />
                  ) : (
                    <span className={styles.value}>{detail?.chitietgiangvien?.sodienthoai || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Email cá nhân</span>
                  {editing ? (
                    <input className={styles.inputField} type="email" value={form.emailcanhan} onChange={setF("emailcanhan")} placeholder="email@gmail.com" />
                  ) : (
                    <span className={styles.value}>{detail?.chitietgiangvien?.emailcanhan || "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Ngày tiếp nhận công tác</span>
                  {editing ? (
                    <input className={styles.inputField} type="date" value={form.ngayvaotruong} onChange={setF("ngayvaotruong")} />
                  ) : (
                    <span className={styles.value}>{detail?.chitietgiangvien?.ngayvaotruong ? new Date(detail.chitietgiangvien.ngayvaotruong).toLocaleDateString("vi-VN") : "—"}</span>
                  )}
                </div>

                <div className={styles.infoField}>
                  <span className={styles.label}>Hệ số lương</span>
                  {editing ? (
                    <input className={styles.inputField} type="number" step="0.01" value={form.hesoluong} onChange={setF("hesoluong")} placeholder="VD: 2.34" />
                  ) : (
                    <span className={styles.value}>
                      {detail?.chitietgiangvien?.hesoluong !== undefined && detail?.chitietgiangvien?.hesoluong !== null
                        ? Number(detail.chitietgiangvien.hesoluong).toFixed(2)
                        : "—"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="modal-actions">
                {editing ? (
                  <>
                    <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>Huỷ</button>
                    <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => { setSuccessDetail(""); setErrorDetail(""); setEditing(true); }}>
                    Chỉnh sửa hồ sơ
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── TAB 2: SCHEDULES & ASSIGNMENTS ─── */}
      {activeTab === "schedule" && (
        <div className={styles.assignmentsPanel}>
          {errorPc && <div className="error-msg">{errorPc}</div>}

          <div className={styles.panelHeader}>
            <div className={styles.panelSelector}>
              <label>Học kỳ:</label>
              <select className={styles.selectSem} value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)}>
                {semesters.map((s) => (
                  <option key={s.mahocky} value={s.mahocky}>
                    {s.tenhocky} ({s.namhoc}) {s.danghieuluc ? " [Hiện tại]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {!showQuickForm && (
              <button className="btn-primary" style={{ padding: "8px 14px", fontSize: "13px" }} onClick={() => setShowQuickForm(true)}>
                + Thêm phân công nhanh
              </button>
            )}
          </div>

          {/* Inline Form */}
          {showQuickForm && (
            <div className={styles.quickFormCard}>
              <h4 className={styles.quickFormTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Phân công môn dạy & lớp dạy mới
              </h4>
              <div className={styles.quickFormGrid}>
                <div className={styles.formField}>
                  <label>Môn giảng dạy *</label>
                  <select value={quickForm.mamon} onChange={(e) => setQuickForm({ ...quickForm, mamon: e.target.value })}>
                    <option value="">-- Chọn môn --</option>
                    {subjects.map((m) => (
                      <option key={m.mamon} value={m.mamon}>{m.tenmon} ({m.mamon})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Lớp học hành chính *</label>
                  <select value={quickForm.malop} onChange={(e) => setQuickForm({ ...quickForm, malop: e.target.value })}>
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((l) => (
                      <option key={l.malop} value={l.malop}>{l.tenlop}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Mã lớp học phần</label>
                  <input
                    placeholder="VD: L01, L02..."
                    value={quickForm.malophoc}
                    onChange={(e) => setQuickForm({ ...quickForm, malophoc: e.target.value })}
                  />
                </div>

                <div className={styles.formField}>
                  <label>Sĩ số tối đa</label>
                  <input
                    type="number"
                    value={quickForm.sisomax}
                    onChange={(e) => setQuickForm({ ...quickForm, sisomax: e.target.value })}
                  />
                </div>

                <div className={`${styles.formField} ${styles.checkField}`}>
                  <input
                    type="checkbox"
                    id="danghieuluc"
                    checked={quickForm.danghieuluc}
                    onChange={(e) => setQuickForm({ ...quickForm, danghieuluc: e.target.checked })}
                  />
                  <label htmlFor="danghieuluc">Có hiệu lực giảng dạy</label>
                </div>
              </div>

              <div className={styles.quickFormActions}>
                <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12.5px" }} onClick={() => setShowQuickForm(false)} disabled={savingPc}>Huỷ</button>
                <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "12.5px" }} onClick={handleCreatePc} disabled={savingPc}>
                  {savingPc ? "Đang lưu…" : "Lưu phân công"}
                </button>
              </div>
            </div>
          )}

          {/* Assignments list */}
          {loadingPc ? (
            <p className="empty-msg" style={{ textAlign: "center", padding: 20 }}>Đang tải danh sách phân công…</p>
          ) : !assignments.length ? (
            <div style={{ textAlign: "center", padding: "30px 20px", background: "#FFFDF9", borderRadius: 12, border: "1px solid #EAD9CB" }}>
              <p style={{ margin: 0, color: "#8B6F5F", fontSize: "13.5px", fontWeight: 500 }}>
                Giảng viên chưa có phân công giảng dạy nào trong học kỳ này.
              </p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã lớp học phần</th>
                    <th>Môn học</th>
                    <th>Lớp hành chính</th>
                    <th>Sĩ số tối đa</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((pc) => (
                    <tr key={pc.maphancong}>
                      <td>
                        <code>{pc.malophoc ?? "—"}</code>
                      </td>
                      <td>
                        <strong style={{ color: "#2D1B14" }}>{pc.monhoc?.tenmon}</strong>
                        <span style={{ display: "block", fontSize: 11, color: "#8B6F5F" }}>Mã môn: {pc.mamon}</span>
                      </td>
                      <td>
                        {pc.lop?.tenlop}
                      </td>
                      <td>
                        {pc.sisomax ?? "—"}
                      </td>
                      <td>
                        <span className={`badge ${pc.danghieuluc ? "badge-green" : "badge-red"}`}>
                          {pc.danghieuluc ? "Đang hiệu lực" : "Ngưng học"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-danger"
                          style={{ fontSize: 11, padding: "2px 8px" }}
                          onClick={() => handleDeletePc(pc.maphancong)}
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTeachersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [gvList, setGvList] = useState<GiangVienRow[]>([]);
  const [khoas, setKhoas] = useState<KhoaRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterKhoa, setFilterKhoa] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [gvLoading, setGvLoading] = useState(true);

  type ModalMode = "create" | "edit" | "delete" | "detail";
  const [modal, setModal] = useState<{
    mode: ModalMode;
    item?: GiangVienRow;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutError, setMutError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.vaitro !== VaiTro.Admin))
      router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user)
      getKhoa()
        .then(setKhoas)
        .catch(() => {});
  }, [user]);

  const loadGV = useCallback(async () => {
    setGvLoading(true);
    try {
      const res = await getGiangVien({
        search,
        makhoa: filterKhoa,
        page,
        limit: 15,
      });
      setGvList(res.data);
      setTotal(res.pagination.total);
      setPages(res.pagination.totalPages);
    } catch {
      /* ignore */
    } finally {
      setGvLoading(false);
    }
  }, [search, filterKhoa, page]);

  useEffect(() => {
    if (user) loadGV();
  }, [user, loadGV]);

  if (loading || !user) return null;

  async function handleSubmit(form: Record<string, unknown>) {
  // ── Validate theo mode ──
  const isEdit = modal?.mode === "edit";
  const errors = isEdit
    ? validateGiangVienUpdate(form)
    : validateGiangVienCreate(form);
  if (errors.length) { setMutError(firstError(errors)); return; }

  setMutating(true); setMutError("");
  try {
    if (isEdit && modal.item) {
      await updateGiangVien(modal.item.magv, form);
    } else {
      await createGiangVien(form);
    }
    setModal(null);
    await loadGV();
  } catch (e) {
    setMutError(e instanceof Error ? e.message : "Lỗi không xác định.");
  } finally { setMutating(false); }
}

  async function handleDelete() {
    if (!modal?.item) return;
    setMutating(true);
    setMutError("");
    try {
      await deleteGiangVien(modal.item.magv);
      setModal(null);
      await loadGV();
    } catch (e) {
      setMutError(e instanceof Error ? e.message : "Không thể xoá.");
    } finally {
      setMutating(false);
    }
  }

  return (
    <DashboardShell pageTitle="Giảng viên">
      <div className={`animate-fadeInUp ${styles.page}`}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Quản lý Giảng viên</h1>
            <p className={styles.pageSub}>
              {total > 0
                ? `${total} giảng viên trong hệ thống`
                : "Quản lý đội ngũ giảng viên"}
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setMutError("");
              setModal({ mode: "create" });
            }}
          >
            + Thêm giảng viên
          </button>
        </div>

        {/* Table */}
        <section className="card" style={{ padding: 0 }}>
          <div className={styles.toolbar}>
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm mã GV hoặc tên…"
            />
            <select
              className={styles.filter}
              value={filterKhoa}
              onChange={(e) => {
                setFilterKhoa(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả khoa</option>
              {khoas.map((k) => (
                <option key={k.makhoa} value={k.makhoa}>
                  {k.tenkhoa}
                </option>
              ))}
            </select>
            {(search || filterKhoa) && (
              <button
                className={styles.clearFilter}
                onClick={() => {
                  setSearch("");
                  setFilterKhoa("");
                  setPage(1);
                }}
              >
                ✕ Xoá lọc
              </button>
            )}
          </div>

          {gvLoading ? (
            <TableSkeleton cols={6} rows={8} />
          ) : (
            <>
              {!gvList.length ? (
                <EmptyState message="Không tìm thấy giảng viên nào." />
              ) : (
                <div className={styles.tableWrap}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Mã GV</th>
                        <th>Họ tên</th>
                        <th>Khoa</th>
                        <th>Học vị</th>
                        <th>Chuyên ngành</th>
                        <th>Email trường</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gvList.map((gv) => (
                        <tr key={gv.magv}>
                          <td>
                            <code style={{ fontSize: 12 }}>{gv.magv}</code>
                          </td>
                          <td>
                            <strong style={{ color: "#2D1B14" }}>
                              {gv.hoten}
                            </strong>
                          </td>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <td style={{ fontSize: 12, color: "#6B4F3F" }}>
                            {(gv as any).khoa?.tenkhoa ?? "—"}
                          </td>
                          <td>
                            {gv.hocvi ? (
                              <span className="badge badge-blue">
                                {gv.hocvi}
                              </span>
                            ) : (
                              <span style={{ color: "#BBA89A" }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {gv.chuyennganh ?? "—"}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {gv.emailtruong ?? "—"}
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <button
                                className="btn-secondary"
                                style={{
                                  fontSize: 12,
                                  padding: "4px 10px",
                                  background: "#FEFAE3",
                                  borderColor: "#FFDBB6",
                                  color: "#6B4F3F",
                                  fontWeight: 600
                                }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "detail", item: gv });
                                }}
                              >
                                Xem chi tiết
                              </button>
                              <button
                                className="btn-secondary"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "edit", item: gv });
                                }}
                              >
                                Sửa
                              </button>
                              <button
                                className="btn-danger"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() => {
                                  setMutError("");
                                  setModal({ mode: "delete", item: gv });
                                }}
                              >
                                Xoá
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination
                page={page}
                totalPages={pages}
                total={total}
                limit={15}
                onPage={setPage}
              />
            </>
          )}
        </section>
      </div>

      {/* ── Modals ── */}
      {modal?.mode === "create" && (
        <AdminModal
          title="Thêm giảng viên mới"
          onClose={() => setModal(null)}
          size="lg"
        >
          <CreateForm
            khoas={khoas}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}
      {modal?.mode === "detail" && modal.item && (
        <AdminModal
          title="Hồ sơ chi tiết & Phân công giảng dạy"
          onClose={() => setModal(null)}
          size="lg"
        >
          <TeacherDetailModal
            item={modal.item}
            khoas={khoas}
            onClose={() => setModal(null)}
          />
        </AdminModal>
      )}
      {modal?.mode === "edit" && modal.item && (
        <AdminModal
          title={`Chỉnh sửa: ${modal.item.hoten}`}
          onClose={() => setModal(null)}
          size="lg"
        >
          <EditForm
            initial={modal.item}
            khoas={khoas}
            onSubmit={handleSubmit}
            onCancel={() => setModal(null)}
            loading={mutating}
            error={mutError}
          />
        </AdminModal>
      )}
      {modal?.mode === "delete" && modal.item && (
        <AdminModal
          title="Xoá giảng viên"
          onClose={() => setModal(null)}
          size="sm"
        >
          <ConfirmDelete
            label={modal.item.hoten}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
            loading={mutating}
          />
          {mutError && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              {mutError}
            </p>
          )}
        </AdminModal>
      )}
    </DashboardShell>
  );
}
