"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AdminModal } from "@/components/admin/Adminmodal";
import {
  Pagination,
  SearchBar,
  TableSkeleton,
  EmptyState,
  ConfirmDelete,
} from "@/components/admin/AdminTable";
import { useGiangVien, type GiangVienRow } from "@/hooks/admin/useGiangvien";
import { useKhoa, type KhoaRow } from "@/hooks/admin/useKhoa";
import { useHocky, type HockyRow } from "@/hooks/admin/useHocky";
import { useMonhoc, type MonhocRow } from "@/hooks/admin/useMonhoc";
import { useLop, type LopRow } from "@/hooks/admin/useLop";
import { usePhanCong, type PhanCongRow } from "@/hooks/admin/usePhancong";
import { VaiTro, GioiTinh } from "@/types";

const GENDER_LABEL: Record<GioiTinh, string> = {
  [GioiTinh.Nam]: "Nam",
  [GioiTinh.Nu]: "Nữ",
  [GioiTinh.Khac]: "Khác",
};
import { CreateForm, EditForm, HOCVI_LIST } from "@/components/admin/TeacherForms";

import {
  validateGiangVienCreate,
  validateGiangVienUpdate,
  firstError,
} from "@/lib/validation/admin.validation";




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

  const { getGiangVienById, updateGiangVien } = useGiangVien();
  const { getHocky } = useHocky();
  const { getPhanCongPaginated, createPhanCong, deletePhanCong } =
    usePhanCong();
  const { getMonhoc } = useMonhoc();
  const { getLop } = useLop();

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
          sodienthoai: data.sodienthoai || "",
          emailcanhan: data.emailcanhan || "",
          ngayvaotruong: data.ngayvaotruong
            ? data.ngayvaotruong.slice(0, 10)
            : "",
          hesoluong:
            data.hesoluong !== undefined &&
            data.hesoluong !== null
              ? String(data.hesoluong)
              : "",
        });
      } catch (err) {
        setErrorDetail(
          err instanceof Error
            ? err.message
            : "Không thể tải chi tiết giảng viên.",
        );
      } finally {
        setLoadingDetail(false);
      }
    }
    load();
  }, [item.magv]);

  // Load semesters
  useEffect(() => {
    getHocky()
      .then((res: any) => {
        setSemesters(res.data);
        // Find active semester
        const active = res.data.find((h: any) => h.danghieuluc);
        if (active) setSelectedSem(String(active.mahocky));
        else if (res.data.length > 0)
          setSelectedSem(String(res.data[0].mahocky));
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
        .then((res: any) => setSubjects(res.data))
        .catch(() => {});
      getLop({ limit: 100 })
        .then((res: any) => setClasses(res.data))
        .catch(() => {});
    }
  }, [showQuickForm]);

  const setF =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        },
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
      setErrorPc(
        err instanceof Error ? err.message : "Không thể tạo phân công.",
      );
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
      <div className="flex items-center gap-4.5 pb-4.5 border-b-2 border-border mb-5">
        <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#FBD9D9] to-[#FFDBB6] flex items-center justify-center text-2xl font-bold text-primary border-2 border-border shadow-[inset_0_2px_4px_rgba(45,27,20,0.05)]">
          {item.hoten ? item.hoten.charAt(0).toUpperCase() : "G"}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-bold text-fg m-0">{detail?.hoten || item.hoten}</h3>
          <div className="flex items-center gap-1.5">
            <span className="badge badge-blue">Giảng viên</span>
            <code>Mã GV: {item.magv}</code>
            {detail?.taikhoan && (
              <span
                className={`badge ${detail.taikhoan.trangthai === "HoatDong" ? "badge-green" : "badge-red"}`}
              >
                Tài khoản:{" "}
                {detail.taikhoan.trangthai === "HoatDong"
                  ? "Hoạt động"
                  : "Đã khoá"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-border mb-5 pb-0.5">
        <button
          className={`px-5 py-2.5 border-none bg-transparent text-sm font-semibold text-fg-subtle cursor-pointer relative transition-all duration-200 rounded-t-lg hover:text-fg hover:bg-[rgba(234,217,203,0.25)] ${activeTab === "profile" ? "text-primary font-bold after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[3px] after:bg-primary after:rounded-full" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Thông tin cá nhân & Công tác
        </button>
        <button
          className={`px-5 py-2.5 border-none bg-transparent text-sm font-semibold text-fg-subtle cursor-pointer relative transition-all duration-200 rounded-t-lg hover:text-fg hover:bg-[rgba(234,217,203,0.25)] ${activeTab === "schedule" ? "text-primary font-bold after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[3px] after:bg-primary after:rounded-full" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          Phân công giảng dạy & Lịch dạy
        </button>
      </div>

      {/* ─── TAB 1: PROFILE ─── */}
      {activeTab === "profile" && (
        <div>
          {loadingDetail ? (
            <p
              className="empty-msg"
              style={{ textAlign: "center", padding: 20 }}
            >
              Đang tải dữ liệu hồ sơ…
            </p>
          ) : (
            <>
              {errorDetail && <div className="error-msg">{errorDetail}</div>}
              {successDetail && (
                <div className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded-lg p-2.5 px-3.5 text-sm mb-3.5 flex items-center gap-1.5">{successDetail}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Basic Section */}
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-primary m-[22px_0_12px] pb-1 border-b border-dashed border-border uppercase tracking-wider">
                    Thông tin học thuật & khoa
                  </h4>
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Họ và tên</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.hoten}
                      onChange={setF("hoten")}
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">{detail?.hoten || "—"}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Khoa công tác</span>
                  {editing ? (
                    <select
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.makhoa}
                      onChange={setF("makhoa")}
                    >
                      <option value="">-- Chọn khoa --</option>
                      {khoas.map((k) => (
                        <option key={k.makhoa} value={k.makhoa}>
                          {k.tenkhoa}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.khoa?.tenkhoa || "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Học vị / Học hàm</span>
                  {editing ? (
                    <select
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.hocvi}
                      onChange={setF("hocvi")}
                    >
                      <option value="">-- Chọn --</option>
                      {HOCVI_LIST.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.hocvi ? (
                        <span className="badge badge-blue">{detail.hocvi}</span>
                      ) : (
                        "—"
                      )}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Chuyên ngành</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.chuyennganh}
                      onChange={setF("chuyennganh")}
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.chuyennganh || "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Email trường cấp</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      type="email"
                      value={form.emailtruong}
                      onChange={setF("emailtruong")}
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.emailtruong || "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Ngày sinh</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      type="date"
                      value={form.ngaysinh}
                      onChange={setF("ngaysinh")}
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.ngaysinh
                        ? new Date(detail.ngaysinh).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Giới tính</span>
                  {editing ? (
                    <select
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.gioitinh}
                      onChange={setF("gioitinh")}
                    >
                      <option value="">-- Chọn --</option>
                      {Object.values(GioiTinh).map((g) => (
                        <option key={g} value={g}>
                          {GENDER_LABEL[g]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.gioitinh || "—"}
                    </span>
                  )}
                </div>

                {/* Extended Contact & Work Section */}
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-primary m-[22px_0_12px] pb-1 border-b border-dashed border-border uppercase tracking-wider">
                    Thông tin liên hệ & công tác mở rộng
                  </h4>
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Số điện thoại di động</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      value={form.sodienthoai}
                      onChange={setF("sodienthoai")}
                      placeholder="VD: 0987654321"
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.sodienthoai || "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Email cá nhân</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      type="email"
                      value={form.emailcanhan}
                      onChange={setF("emailcanhan")}
                      placeholder="email@gmail.com"
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.emailcanhan || "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Ngày tiếp nhận công tác</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      type="date"
                      value={form.ngayvaotruong}
                      onChange={setF("ngayvaotruong")}
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.ngayvaotruong
                        ? new Date(
                            detail.ngayvaotruong,
                          ).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 bg-[#FFFDF9] p-2.5 px-3.5 rounded-xl border border-border shadow-[0_1px_3px_rgba(45,27,20,0.02)]">
                  <span className="text-[10.5px] font-semibold text-fg-subtle uppercase tracking-wide">Hệ số lương</span>
                  {editing ? (
                    <input
                      className="border-[1.5px] border-border rounded-lg p-1.5 px-2.5 text-[13.5px] text-fg bg-white w-full outline-none font-semibold transition-all duration-150 focus:border-primary focus:shadow-[0_0_0_3px_rgba(194,84,80,0.1)]"
                      type="number"
                      step="0.01"
                      value={form.hesoluong}
                      onChange={setF("hesoluong")}
                      placeholder="VD: 2.34"
                    />
                  ) : (
                    <span className="text-[13.5px] font-semibold text-fg">
                      {detail?.hesoluong !== undefined &&
                      detail?.hesoluong !== null
                        ? Number(detail.hesoluong).toFixed(2)
                        : "—"}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="modal-actions">
                {editing ? (
                  <>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                    >
                      Huỷ
                    </button>
                    <button
                      className="btn-primary"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSuccessDetail("");
                      setErrorDetail("");
                      setEditing(true);
                    }}
                  >
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
        <div className="flex flex-col gap-4">
          {errorPc && <div className="error-msg">{errorPc}</div>}

          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#6B4F3F]">Học kỳ:</label>
              <select
                className="p-2 px-3 border-[1.5px] border-border rounded-xl text-[13.5px] text-fg bg-white outline-none cursor-pointer font-medium focus:border-primary"
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s.mahocky} value={s.mahocky}>
                    {s.tenhocky} ({s.namhoc}){" "}
                    {s.danghieuluc ? " [Hiện tại]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {!showQuickForm && (
              <button
                className="btn-primary"
                style={{ padding: "8px 14px", fontSize: "13px" }}
                onClick={() => setShowQuickForm(true)}
              >
                + Thêm phân công nhanh
              </button>
            )}
          </div>

          {/* Inline Form */}
          {showQuickForm && (
            <div className="bg-gradient-to-br from-[#FEFAE3] to-[#FFF0CD] border border-[#FFDBB6] rounded-xl p-4 mb-4 animate-slideDown">
              <h4 className="text-sm font-bold text-fg m-0 mb-3 flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Phân công môn dạy & lớp dạy mới
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#6B4F3F] uppercase">Môn giảng dạy *</label>
                  <select
                    className="border-[1.5px] border-border rounded-lg p-2 px-2.5 text-xs text-fg bg-white outline-none w-full focus:border-primary"
                    value={quickForm.mamon}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, mamon: e.target.value })
                    }
                  >
                    <option value="">-- Chọn môn --</option>
                    {subjects.map((m) => (
                      <option key={m.mamon} value={m.mamon}>
                        {m.tenmon} ({m.mamon})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#6B4F3F] uppercase">Lớp học hành chính *</label>
                  <select
                    className="border-[1.5px] border-border rounded-lg p-2 px-2.5 text-xs text-fg bg-white outline-none w-full focus:border-primary"
                    value={quickForm.malop}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, malop: e.target.value })
                    }
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((l) => (
                      <option key={l.malop} value={l.malop}>
                        {l.tenlop}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#6B4F3F] uppercase">Mã lớp học phần</label>
                  <input
                    className="border-[1.5px] border-border rounded-lg p-2 px-2.5 text-xs text-fg bg-white outline-none w-full focus:border-primary"
                    placeholder="VD: L01, L02..."
                    value={quickForm.malophoc}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, malophoc: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#6B4F3F] uppercase">Sĩ số tối đa</label>
                  <input
                    className="border-[1.5px] border-border rounded-lg p-2 px-2.5 text-xs text-fg bg-white outline-none w-full focus:border-primary"
                    type="number"
                    value={quickForm.sisomax}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, sisomax: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2 md:pt-6">
                  <input
                    type="checkbox"
                    id="danghieuluc"
                    className="w-4 h-4 accent-primary cursor-pointer"
                    checked={quickForm.danghieuluc}
                    onChange={(e) =>
                      setQuickForm({
                        ...quickForm,
                        danghieuluc: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="danghieuluc" className="text-sm font-semibold text-fg cursor-pointer normal-case">Có hiệu lực giảng dạy</label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2.5 border-t border-dashed border-border">
                <button
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12.5px" }}
                  onClick={() => setShowQuickForm(false)}
                  disabled={savingPc}
                >
                  Huỷ
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: "6px 14px", fontSize: "12.5px" }}
                  onClick={handleCreatePc}
                  disabled={savingPc}
                >
                  {savingPc ? "Đang lưu…" : "Lưu phân công"}
                </button>
              </div>
            </div>
          )}

          {/* Assignments list */}
          {loadingPc ? (
            <p
              className="empty-msg"
              style={{ textAlign: "center", padding: 20 }}
            >
              Đang tải danh sách phân công…
            </p>
          ) : !assignments.length ? (
            <div
              style={{
                textAlign: "center",
                padding: "30px 20px",
                background: "#FFFDF9",
                borderRadius: 12,
                border: "1px solid #EAD9CB",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#8B6F5F",
                  fontSize: "13.5px",
                  fontWeight: 500,
                }}
              >
                Giảng viên chưa có phân công giảng dạy nào trong học kỳ này.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
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
                        <strong style={{ color: "#2D1B14" }}>
                          {pc.monhoc?.tenmon}
                        </strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            color: "#8B6F5F",
                          }}
                        >
                          Mã môn: {pc.mamon}
                        </span>
                      </td>
                      <td>{pc.lop?.tenlop}</td>
                      <td>{pc.sisomax ?? "—"}</td>
                      <td>
                        <span
                          className={`badge ${pc.danghieuluc ? "badge-green" : "badge-red"}`}
                        >
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
  const { getKhoa } = useKhoa();
  const { getLop } = useLop();
  const {
    getGiangVien,
    getGiangVienById,
    createGiangVien,
    updateGiangVien,
    deleteGiangVien,
  } = useGiangVien();
  const { getPhanCongPaginated, createPhanCong, deletePhanCong } =
    usePhanCong();
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
    if (errors.length) {
      setMutError(firstError(errors));
      return;
    }

    setMutating(true);
    setMutError("");
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
    } finally {
      setMutating(false);
    }
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
      <div className="animate-fadeInUp flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch">
          <div>
            <h1 className="text-2xl font-bold text-fg m-0 max-sm:text-lg">Quản lý Giảng viên</h1>
            <p className="text-xs text-fg-subtle mt-1">
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
          <div className="flex items-center gap-2.5 p-4 border-b border-border flex-wrap max-sm:flex-col max-sm:items-stretch">
            <SearchBar
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Tìm mã GV hoặc tên…"
            />
            <select
              className="p-[9px_12px] border-[1.5px] border-border rounded-xl text-[13px] text-fg bg-white cursor-pointer outline-none transition-colors duration-200 focus:border-primary min-w-[160px] max-sm:w-full"
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
                className="p-[9px_14px] border-[1.5px] border-primary rounded-xl text-[13px] text-primary bg-[#FFF5F5] cursor-pointer whitespace-nowrap transition-all hover:bg-primary hover:text-white max-sm:w-full"
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
                <div className="w-full overflow-x-auto">
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
                            <div className="flex gap-1.5">
                              <button
                                className="btn-secondary"
                                style={{
                                  fontSize: 12,
                                  padding: "4px 10px",
                                  background: "#FEFAE3",
                                  borderColor: "#FFDBB6",
                                  color: "#6B4F3F",
                                  fontWeight: 600,
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
