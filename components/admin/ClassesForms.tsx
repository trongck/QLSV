"use client";

import { useState } from "react";
import type { KhoaRow } from "@/hooks/admin/useKhoa";
import type { LopRow } from "@/hooks/admin/useLop";

// ─── Khoa Form ────────────────────────────────────────────────────────────────

interface KhoaFormProps {
  initial?: KhoaRow;
  onSubmit: (d: Omit<KhoaRow, "ngaytao">) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function KhoaForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: KhoaFormProps) {
  const [form, setForm] = useState({
    makhoa: initial?.makhoa ?? "",
    tenkhoa: initial?.tenkhoa ?? "",
    dienthoai: initial?.dienthoai ?? "",
    email: initial?.email ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã khoa *</label>
          <input
            value={form.makhoa}
            onChange={set("makhoa")}
            placeholder="VD: CNTT"
            disabled={!!initial}
          />
        </div>
        <div className="field full">
          <label>Tên khoa *</label>
          <input
            value={form.tenkhoa}
            onChange={set("tenkhoa")}
            placeholder="VD: Công nghệ thông tin"
          />
        </div>
        <div className="field">
          <label>Điện thoại</label>
          <input
            value={form.dienthoai}
            onChange={set("dienthoai")}
            placeholder="028 xxxx xxxx"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="khoa@truong.edu.vn"
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
          {loading ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo khoa"}
        </button>
      </div>
    </>
  );
}

// ─── Lop Form ─────────────────────────────────────────────────────────────────

interface LopFormProps {
  initial?: LopRow;
  khoas: KhoaRow[];
  onSubmit: (d: Omit<LopRow, "siso">) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function LopForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: LopFormProps) {
  const [form, setForm] = useState({
    malop: initial?.malop ?? "",
    tenlop: initial?.tenlop ?? "",
    makhoa: initial?.makhoa ?? "",
    nganh: initial?.nganh ?? "",
    khoahoc: initial?.khoahoc ?? "",
    magv: initial?.magv ?? "",
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
          <label>Mã lớp *</label>
          <input
            value={form.malop}
            onChange={set("malop")}
            placeholder="VD: CNTT01"
            disabled={!!initial}
          />
        </div>
        <div className="field full">
          <label>Tên lớp *</label>
          <input
            value={form.tenlop}
            onChange={set("tenlop")}
            placeholder="VD: Lớp Công nghệ thông tin 01"
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
        <div className="field">
          <label>Ngành học</label>
          <input
            value={form.nganh}
            onChange={set("nganh")}
            placeholder="VD: Kỹ thuật phần mềm"
          />
        </div>
        <div className="field">
          <label>Khoá học</label>
          <input
            value={form.khoahoc}
            onChange={set("khoahoc")}
            placeholder="VD: 2022-2026"
          />
        </div>
        <div className="field">
          <label>Mã GVCN</label>
          <input
            value={form.magv}
            onChange={set("magv")}
            placeholder="VD: GV001"
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
          {loading ? "Đang lưu…" : initial ? "Cập nhật" : "Tạo lớp"}
        </button>
      </div>
    </>
  );
}
