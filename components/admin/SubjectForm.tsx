"use client";

import { useState } from "react";
import type { MonhocRow } from "@/hooks/admin/useMonhoc";
import type { KhoaRow } from "@/hooks/admin/useKhoa";

interface SubjectFormProps {
  initial?: Partial<MonhocRow>;
  khoas: KhoaRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function SubjectForm({
  initial,
  khoas,
  onSubmit,
  onCancel,
  loading,
  error,
}: SubjectFormProps) {
  const [form, setForm] = useState({
    mamon: initial?.mamon ?? "",
    tenmon: initial?.tenmon ?? "",
    sotinchi: initial?.sotinchi ?? 3,
    sotietlythuyet: initial?.sotietlythuyet ?? 0,
    sotietthuchanh: initial?.sotietthuchanh ?? 0,
    mota: initial?.mota ?? "",
    batbuoc: initial?.batbuoc ?? true,
    makhoa: initial?.makhoa ?? "",
  });

  const [validation, setValidation] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.mamon.trim()) errs.mamon = "Mã môn không được trống.";
    if (!form.tenmon.trim()) errs.tenmon = "Tên môn không được trống.";
    if (form.sotinchi < 1) errs.sotinchi = "Tín chỉ tối thiểu là 1.";
    setValidation(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSumbitClick = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Mã môn học *</label>
          <input
            value={form.mamon}
            onChange={(e) =>
              setForm({ ...form, mamon: e.target.value.toUpperCase() })
            }
            disabled={!!initial?.mamon}
            placeholder="VD: INT1234"
          />
          {validation.mamon && (
            <span style={{ fontSize: 12, color: "#C25450", marginTop: 2 }}>
              {validation.mamon}
            </span>
          )}
        </div>
        <div className="field">
          <label>Tên môn học *</label>
          <input
            value={form.tenmon}
            onChange={(e) => setForm({ ...form, tenmon: e.target.value })}
            placeholder="VD: Cấu trúc dữ liệu"
          />
          {validation.tenmon && (
            <span style={{ fontSize: 12, color: "#C25450", marginTop: 2 }}>
              {validation.tenmon}
            </span>
          )}
        </div>
        <div className="field">
          <label>Số tín chỉ *</label>
          <input
            type="number"
            value={form.sotinchi}
            onChange={(e) =>
              setForm({ ...form, sotinchi: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label>Khoa quản lý</label>
          <select
            value={form.makhoa ?? ""}
            onChange={(e) => setForm({ ...form, makhoa: e.target.value })}
          >
            <option value="">-- Chọn khoa --</option>
            {khoas.map((k) => (
              <option key={k.makhoa} value={k.makhoa}>
                {k.tenkhoa}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Số tiết lý thuyết</label>
          <input
            type="number"
            value={form.sotietlythuyet}
            onChange={(e) =>
              setForm({ ...form, sotietlythuyet: Number(e.target.value) })
            }
          />
        </div>
        <div className="field">
          <label>Số tiết thực hành</label>
          <input
            type="number"
            value={form.sotietthuchanh}
            onChange={(e) =>
              setForm({ ...form, sotietthuchanh: Number(e.target.value) })
            }
          />
        </div>
        <div className="field full">
          <label>Loại môn học</label>
          <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={form.batbuoc}
                onChange={() => setForm({ ...form, batbuoc: true })}
              />
              Bắt buộc
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                checked={!form.batbuoc}
                onChange={() => setForm({ ...form, batbuoc: false })}
              />
              Tự chọn
            </label>
          </div>
        </div>
        <div className="field full">
          <label>Mô tả môn học</label>
          <textarea
            rows={3}
            value={form.mota ?? ""}
            onChange={(e) => setForm({ ...form, mota: e.target.value })}
            placeholder="Thông tin tóm tắt về môn học..."
          />
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={handleSumbitClick}
          disabled={loading}
        >
          {loading
            ? "Đang lưu..."
            : initial?.mamon
              ? "Cập nhật"
              : "Thêm môn học"}
        </button>
      </div>
    </>
  );
}
