"use client";

import { useState } from "react";
import { GioiTinh } from "@/types";
import type { GiangVienRow } from "@/hooks/admin/useGiangvien";
import type { KhoaRow } from "@/hooks/admin/useKhoa";

const GENDER_LABEL: Record<GioiTinh, string> = {
  [GioiTinh.Nam]: "Nam",
  [GioiTinh.Nu]: "Nữ",
  [GioiTinh.Khac]: "Khác",
};

export const HOCVI_LIST = ["Cử nhân", "Thạc sĩ", "Tiến sĩ", "Phó Giáo sư", "Giáo sư"];

// ─── Create Form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function CreateForm({
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: CreateFormProps) {
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
            {Object.values(GioiTinh).map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
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

interface EditFormProps {
  initial: GiangVienRow;
  khoas: KhoaRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function EditForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditFormProps) {
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
            {Object.values(GioiTinh).map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL[g]}
              </option>
            ))}
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
