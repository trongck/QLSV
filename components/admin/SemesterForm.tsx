"use client";

import { useState } from "react";
import type { HockyRow } from "@/hooks/admin/useHocky";

interface HockyFormProps {
  initial?: Partial<HockyRow>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function HockyForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
}: HockyFormProps) {
  const [form, setForm] = useState({
    tenhocky: initial?.tenhocky ?? "",
    namhoc: initial?.namhoc ?? new Date().getFullYear(),
    ky: initial?.ky ?? 1,
    ngaybatdau: initial?.ngaybatdau ?? "",
    ngayketthuc: initial?.ngayketthuc ?? "",
    danghieuluc: initial?.danghieuluc ?? false,
  });

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Tên học kỳ *</label>
          <input
            value={form.tenhocky}
            onChange={(e) => setForm({ ...form, tenhocky: e.target.value })}
            placeholder="VD: Học kỳ 1 năm học 2023-2024"
          />
        </div>
        <div className="field">
          <label>Năm học (năm bắt đầu) *</label>
          <input
            type="number"
            value={form.namhoc}
            onChange={(e) =>
              setForm({ ...form, namhoc: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label>Kỳ *</label>
          <select
            value={form.ky}
            onChange={(e) => setForm({ ...form, ky: Number(e.target.value) })}
          >
            <option value={1}>Học kỳ 1</option>
            <option value={2}>Học kỳ 2</option>
            <option value={3}>Học kỳ hè</option>
          </select>
        </div>
        <div className="field">
          <label>Ngày bắt đầu</label>
          <input
            type="date"
            value={form.ngaybatdau}
            onChange={(e) => setForm({ ...form, ngaybatdau: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Ngày kết thúc</label>
          <input
            type="date"
            value={form.ngayketthuc}
            onChange={(e) => setForm({ ...form, ngayketthuc: e.target.value })}
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
          {loading ? "Đang lưu…" : initial?.mahocky ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </>
  );
}
