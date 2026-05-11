"use client";

import { useState } from "react";
import { LoaiPhongHoc } from "@/types";
import type { LichHocRow } from "@/hooks/admin/useLichhoc";
import type { PhanCongRow } from "@/hooks/admin/usePhancong";
import type { PhongHocRow } from "@/hooks/admin/usePhonghoc";

// Helper to translate day of week to Vietnamese label
export const getDayLabel = (thu: number) => {
  if (thu === 8) return "Chủ Nhật";
  return `Thứ ${thu}`;
};

// Helper to translate room type to Vietnamese label
export const getRoomTypeLabel = (type: string | null | undefined) => {
  if (type === LoaiPhongHoc.Lythuyet) return "Lý thuyết";
  if (type === LoaiPhongHoc.Thuchanh) return "Thực hành";
  if (type === LoaiPhongHoc.Online) return "Trực tuyến";
  return "N/A";
};

interface ScheduleFormProps {
  initial?: Partial<LichHocRow>;
  phancongs: PhanCongRow[];
  phonghocs: PhongHocRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function ScheduleForm({
  initial,
  phancongs,
  phonghocs,
  onSubmit,
  onCancel,
  loading,
  error,
}: ScheduleFormProps) {
  const [form, setForm] = useState({
    maphancong: initial?.maphancong ? String(initial.maphancong) : "",
    thutrongtuan: initial?.thutrongtuan ? String(initial.thutrongtuan) : "2",
    tietbatdau: initial?.tietbatdau ? String(initial.tietbatdau) : "1",
    tietketthuc: initial?.tietketthuc ? String(initial.tietketthuc) : "3",
    maphong: initial?.maphong ?? "",
    ghichu: initial?.ghichu ?? "",
  });

  const [localErr, setLocalErr] = useState("");

  const handleValidateAndSubmit = () => {
    setLocalErr("");
    if (!form.maphancong)
      return setLocalErr("Vui lòng chọn phân công giảng dạy.");

    const thu = parseInt(form.thutrongtuan);
    if (isNaN(thu) || thu < 2 || thu > 8)
      return setLocalErr("Thứ trong tuần không hợp lệ.");

    const tbd = parseInt(form.tietbatdau);
    const tkt = parseInt(form.tietketthuc);
    if (
      isNaN(tbd) ||
      tbd < 1 ||
      tbd > 15 ||
      isNaN(tkt) ||
      tkt < 1 ||
      tkt > 15
    ) {
      return setLocalErr("Tiết học phải thuộc khoảng từ 1 đến 15.");
    }
    if (tbd > tkt) {
      return setLocalErr("Tiết bắt đầu không thể lớn hơn tiết kết thúc.");
    }

    onSubmit({
      ...form,
      maphancong: parseInt(form.maphancong),
      thutrongtuan: thu,
      tietbatdau: tbd,
      tietketthuc: tkt,
    });
  };

  return (
    <>
      {(error || localErr) && (
        <div className="error-msg">{error || localErr}</div>
      )}
      <div className="form-grid">
        <div className="field full">
          <label>Phân công Giảng dạy (Lớp & Môn học) *</label>
          <select
            value={form.maphancong}
            onChange={(e) => setForm({ ...form, maphancong: e.target.value })}
            disabled={!!initial?.malichhoc} // Can't change assignment on edit
          >
            <option value="">-- Chọn phân công dạy học --</option>
            {phancongs.map((pc) => (
              <option key={pc.maphancong} value={pc.maphancong}>
                #{pc.maphancong} | {pc.monhoc?.tenmon} - {pc.giangvien?.hoten} (
                {pc.lop?.tenlop})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Thứ trong tuần *</label>
          <select
            value={form.thutrongtuan}
            onChange={(e) => setForm({ ...form, thutrongtuan: e.target.value })}
          >
            <option value="2">Thứ Hai</option>
            <option value="3">Thứ Ba</option>
            <option value="4">Thứ Tư</option>
            <option value="5">Thứ Năm</option>
            <option value="6">Thứ Sáu</option>
            <option value="7">Thứ Bảy</option>
            <option value="8">Chủ Nhật</option>
          </select>
        </div>

        <div className="field">
          <label>Phòng học</label>
          <select
            value={form.maphong}
            onChange={(e) => setForm({ ...form, maphong: e.target.value })}
          >
            <option value="">-- Chưa xếp phòng --</option>
            {phonghocs.map((ph) => (
              <option key={ph.maphong} value={ph.maphong}>
                {ph.maphong} ({getRoomTypeLabel(ph.loaiphong)}) - {ph.suchua}{" "}
                chỗ
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tiết bắt đầu *</label>
          <select
            value={form.tietbatdau}
            onChange={(e) => setForm({ ...form, tietbatdau: e.target.value })}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                Tiết {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Tiết kết thúc *</label>
          <select
            value={form.tietketthuc}
            onChange={(e) => setForm({ ...form, tietketthuc: e.target.value })}
          >
            {Array.from({ length: 15 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                Tiết {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field full">
          <label>Ghi chú lịch học</label>
          <textarea
            rows={3}
            value={form.ghichu}
            onChange={(e) => setForm({ ...form, ghichu: e.target.value })}
            placeholder="Nhập thông tin ghi chú (nếu có)..."
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
          {loading
            ? "Đang xếp lịch..."
            : initial?.malichhoc
              ? "Cập nhật"
              : "Xếp lịch học"}
        </button>
      </div>
    </>
  );
}
