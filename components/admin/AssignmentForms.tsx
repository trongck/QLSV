"use client";

import { useState, useEffect } from "react";
import type { PhanCongRow } from "@/hooks/admin/usePhancong";
import type { GiangVienRow } from "@/hooks/admin/useGiangvien";
import type { MonhocRow } from "@/hooks/admin/useMonhoc";
import type { LopRow } from "@/hooks/admin/useLop";
import type { HockyRow } from "@/hooks/admin/useHocky";

interface AssignmentFormProps {
  initial?: Partial<PhanCongRow>;
  giangviens: GiangVienRow[];
  monhocs: MonhocRow[];
  lops: LopRow[];
  hockys: HockyRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function AssignmentForm({
  initial,
  giangviens,
  monhocs,
  lops,
  hockys,
  onSubmit,
  onCancel,
  loading,
  error,
}: AssignmentFormProps) {
  const [form, setForm] = useState({
    magv: initial?.magv ?? "",
    mamon: initial?.mamon ?? "",
    malop: initial?.malop ?? "",
    mahocky: initial?.mahocky ? String(initial.mahocky) : "",
    malophoc: initial?.malophoc ?? "",
    sisomax: initial?.sisomax ? String(initial.sisomax) : "",
    danghieuluc: initial?.danghieuluc ?? true,
    ngaybatdau: initial?.ngaybatdau ? new Date(initial.ngaybatdau).toISOString().split("T")[0] : "",
    ngayketthuc: initial?.ngayketthuc ? new Date(initial.ngayketthuc).toISOString().split("T")[0] : "",
  });

  const [localErr, setLocalErr] = useState("");

  // Auto-generate Section Code (Mã lớp học phần) based on Class and Subject
  useEffect(() => {
    if (!initial?.maphancong && form.mamon && form.malop && !form.malophoc) {
      setForm((prev) => ({
        ...prev,
        malophoc: `${prev.mamon.trim()}-${prev.malop.trim()}`,
      }));
    }
  }, [form.mamon, form.malop, form.malophoc, initial?.maphancong]);

  const handleValidateAndSubmit = () => {
    setLocalErr("");
    if (!form.magv) return setLocalErr("Vui lòng chọn giảng viên.");
    if (!form.mamon) return setLocalErr("Vui lòng chọn môn học.");
    if (!form.malop) return setLocalErr("Vui lòng chọn lớp hành chính.");
    if (!form.mahocky) return setLocalErr("Vui lòng chọn học kỳ.");

    if (form.sisomax) {
      const size = parseInt(form.sisomax);
      if (isNaN(size) || size <= 0) {
        return setLocalErr("Sĩ số tối đa phải là số nguyên dương.");
      }
    }

    if (form.ngaybatdau && form.ngayketthuc) {
      if (new Date(form.ngaybatdau) > new Date(form.ngayketthuc)) {
        return setLocalErr("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      }
    }

    // Additional cross-check with semester dates (optional but good for UX)
    const selectedHk = hockys.find(h => String(h.mahocky) === form.mahocky);
    if (selectedHk) {
      if (form.ngaybatdau && selectedHk.ngaybatdau && new Date(form.ngaybatdau) < new Date(selectedHk.ngaybatdau)) {
        return setLocalErr(`Ngày bắt đầu không được nhỏ hơn ngày bắt đầu học kỳ (${new Date(selectedHk.ngaybatdau).toLocaleDateString()})`);
      }
      if (form.ngayketthuc && selectedHk.ngayketthuc && new Date(form.ngayketthuc) > new Date(selectedHk.ngayketthuc)) {
        return setLocalErr(`Ngày kết thúc không được lớn hơn ngày kết thúc học kỳ (${new Date(selectedHk.ngayketthuc).toLocaleDateString()})`);
      }
    }

    onSubmit({
      ...form,
      mahocky: parseInt(form.mahocky),
      sisomax: form.sisomax ? parseInt(form.sisomax) : null,
      ngaybatdau: form.ngaybatdau || null,
      ngayketthuc: form.ngayketthuc || null,
    });
  };

  return (
    <>
      {(error || localErr) && (
        <div className="error-msg">{error || localErr}</div>
      )}
      <div className="form-grid">
        <div className="field">
          <label>Giảng viên phụ trách *</label>
          <select
            value={form.magv}
            onChange={(e) => setForm({ ...form, magv: e.target.value })}
          >
            <option value="">-- Chọn giảng viên --</option>
            {giangviens.map((gv) => (
              <option key={gv.magv} value={gv.magv}>
                {gv.hoten} ({gv.magv})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Học kỳ *</label>
          <select
            value={form.mahocky}
            onChange={(e) => setForm({ ...form, mahocky: e.target.value })}
          >
            <option value="">-- Chọn học kỳ --</option>
            {hockys.map((hk) => (
              <option key={hk.mahocky} value={hk.mahocky}>
                {hk.tenhocky} ({hk.namhoc})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Môn học *</label>
          <select
            value={form.mamon}
            onChange={(e) => setForm({ ...form, mamon: e.target.value })}
          >
            <option value="">-- Chọn môn học --</option>
            {monhocs.map((mh) => (
              <option key={mh.mamon} value={mh.mamon}>
                {mh.tenmon} ({mh.mamon})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Lớp hành chính *</label>
          <select
            value={form.malop}
            onChange={(e) => setForm({ ...form, malop: e.target.value })}
          >
            <option value="">-- Chọn lớp hành chính --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop} ({l.malop})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Mã lớp học phần (Tuỳ chọn)</label>
          <input
            value={form.malophoc}
            onChange={(e) => setForm({ ...form, malophoc: e.target.value })}
            placeholder="Ví dụ: INT1306-D21CN"
          />
          <span
            style={{
              fontSize: 11,
              color: "#8B6F5F",
              marginTop: 4,
              display: "block",
            }}
          >
            Tự động gợi ý dựa trên môn học và lớp học.
          </span>
        </div>

        <div className="field">
          <label>Sĩ số tối đa (Tuỳ chọn)</label>
          <input
            type="number"
            value={form.sisomax}
            onChange={(e) => setForm({ ...form, sisomax: e.target.value })}
            placeholder="Ví dụ: 80"
          />
        </div>

        <div className="field full">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={form.danghieuluc}
              onChange={(e) =>
                setForm({ ...form, danghieuluc: e.target.checked })
              }
            />
            Đang hoạt động / Hiệu lực giảng dạy
          </label>
        </div>

        <div className="field">
          <label>Ngày bắt đầu giảng dạy (Tuỳ chọn)</label>
          <input
            type="date"
            value={form.ngaybatdau}
            onChange={(e) => setForm({ ...form, ngaybatdau: e.target.value })}
          />
        </div>

        <div className="field">
          <label>Ngày kết thúc giảng dạy (Tuỳ chọn)</label>
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
          onClick={handleValidateAndSubmit}
          disabled={loading}
        >
          {loading ? "Đang xử lý…" : initial?.maphancong ? "Cập nhật" : "Tạo phân công"}
        </button>
      </div>
    </>
  );
}
