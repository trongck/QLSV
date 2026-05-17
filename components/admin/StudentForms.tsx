"use client";

import { useState } from "react";
import { TrangThaiSinhVien, GioiTinh } from "@/types";
import type { SinhVienRow } from "@/hooks/admin/useSinhVien/useSinhvien";
import type { LopRow } from "@/hooks/admin/useLop";

const STATUS_LABEL: Record<TrangThaiSinhVien, string> = {
  [TrangThaiSinhVien.Danghoc]: "Đang học",
  [TrangThaiSinhVien.Baoluu]: "Bảo lưu",
  [TrangThaiSinhVien.Thoi]: "Thôi học",
  [TrangThaiSinhVien.Totnghiep]: "Tốt nghiệp",
};

const GENDER_LABEL: Record<GioiTinh, string> = {
  [GioiTinh.Nam]: "Nam",
  [GioiTinh.Nu]: "Nữ",
  [GioiTinh.Khac]: "Khác",
};

// ─── Create Form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  lops: LopRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function CreateForm({
  lops,
  onSubmit,
  onCancel,
  loading,
  error,
}: CreateFormProps) {
  const [form, setForm] = useState({
    masv: "",
    malop: "",
    hoten: "",
    ngaysinh: "",
    gioitinh: "",
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
          <label>MSSV *</label>
          <input
            value={form.masv}
            onChange={set("masv")}
            placeholder="VD: SV001"
          />
        </div>
        <div className="field">
          <label>Lớp *</label>
          <select value={form.malop} onChange={set("malop")}>
            <option value="">-- Chọn lớp --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Họ và tên *</label>
          <input
            value={form.hoten}
            onChange={set("hoten")}
            placeholder="Nguyễn Văn A"
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
          <label>Email trường</label>
          <input
            type="email"
            value={form.emailtruong}
            onChange={set("emailtruong")}
            placeholder="sv@truong.edu.vn"
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
          {loading ? "Đang lưu…" : "Tạo sinh viên"}
        </button>
      </div>
    </>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  initial: SinhVienRow;
  lops: LopRow[];
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function EditForm({
  initial,
  lops,
  onSubmit,
  onCancel,
  loading,
  error,
}: EditFormProps) {
  const [form, setForm] = useState({
    hoten: initial.hoten,
    malop: initial.malop,
    ngaysinh: initial.ngaysinh?.slice(0, 10) ?? "",
    gioitinh: initial.gioitinh ?? "",
    emailtruong: initial.emailtruong ?? "",
    trangthai: initial.trangthai,
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
          <label>Lớp</label>
          <select value={form.malop} onChange={set("malop")}>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Trạng thái</label>
          <select value={form.trangthai} onChange={set("trangthai")}>
            {Object.values(TrangThaiSinhVien).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
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
