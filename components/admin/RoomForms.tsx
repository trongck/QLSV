"use client";

import { useState, useCallback } from "react";
import { LoaiPhongHoc } from "@/types";
import type { PhongHocRow, RoomSchedule } from "@/hooks/admin/usePhonghoc";

export const ROOM_TYPE_LABEL: Record<LoaiPhongHoc, string> = {
  [LoaiPhongHoc.Lythuyet]: "Lý thuyết",
  [LoaiPhongHoc.Thuchanh]: "Thực hành",
  [LoaiPhongHoc.Online]: "Trực tuyến",
};

export const ROOM_TYPE_BADGE: Record<LoaiPhongHoc, string> = {
  [LoaiPhongHoc.Lythuyet]: "badge-green",
  [LoaiPhongHoc.Thuchanh]: "badge-yellow",
  [LoaiPhongHoc.Online]: "badge-red",
};

export const THU_LABELS: Record<number, string> = {
  2: "Thứ 2",
  3: "Thứ 3",
  4: "Thứ 4",
  5: "Thứ 5",
  6: "Thứ 6",
  7: "Thứ 7",
  8: "Chủ nhật",
};

// ─── Room Form ───────────────────────────────────────────────────────────────

interface PhongHocFormProps {
  initial?: Partial<PhongHocRow>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
  isEdit?: boolean;
}

export function PhongHocForm({
  initial,
  onSubmit,
  onCancel,
  loading,
  error,
  isEdit = false,
}: PhongHocFormProps) {
  const [form, setForm] = useState({
    maphong: initial?.maphong ?? "",
    loaiphong: initial?.loaiphong ?? LoaiPhongHoc.Lythuyet,
    suchua: initial?.suchua ?? 50,
  });

  return (
    <>
      {error && (
        <div className="error-msg" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      <div className="form-grid">
        <div className="field full">
          <label>Mã phòng học *</label>
          <input
            value={form.maphong}
            onChange={(e) => setForm({ ...form, maphong: e.target.value })}
            placeholder="VD: A1-302, LAB-02"
            disabled={isEdit}
          />
          {isEdit && (
            <small style={{ color: "#8B6F5F" }}>
              Mã phòng học không thể thay đổi sau khi tạo.
            </small>
          )}
        </div>
        <div className="field">
          <label>Loại phòng *</label>
          <select
            value={form.loaiphong}
            onChange={(e) => setForm({ ...form, loaiphong: e.target.value })}
          >
            {Object.values(LoaiPhongHoc).map((type) => (
              <option key={type} value={type}>
                {ROOM_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Sức chứa (chỗ ngồi) *</label>
          <input
            type="number"
            min={1}
            value={form.suchua}
            onChange={(e) =>
              setForm({ ...form, suchua: Number(e.target.value) })
            }
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
          {loading ? "Đang lưu…" : isEdit ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </>
  );
}

// ─── Conflict Checker Form ───────────────────────────────────────────────────

interface ConflictCheckerFormProps {
  maphong: string;
  onCheck: (params: {
    thutrongtuan: number;
    tietbatdau: number;
    tietketthuc: number;
  }) => Promise<any>;
  loading: boolean;
}

export function ConflictCheckerForm({
  maphong,
  onCheck,
  loading,
}: ConflictCheckerFormProps) {
  const [thutrongtuan, setThutrongtuan] = useState(2);
  const [tietbatdau, setTietbatdau] = useState(1);
  const [tietketthuc, setTietketthuc] = useState(3);
  const [result, setResult] = useState<{
    checked: boolean;
    isConflict: boolean;
    conflicts: any[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    if (tietbatdau > tietketthuc) {
      setError("Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc.");
      return;
    }
    try {
      const res = await onCheck({ thutrongtuan, tietbatdau, tietketthuc });
      setResult({
        checked: true,
        isConflict: res.isConflict,
        conflicts: res.conflicts || [],
      });
    } catch (e: any) {
      setError(e.message || "Lỗi kiểm tra xung đột.");
    }
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <p style={{ marginBottom: 16 }}>
        Kiểm tra tình trạng trống của phòng học <strong>{maphong}</strong> tại
        thời gian định sẵn:
      </p>

      {error && (
        <div className="error-msg" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Thứ trong tuần *</label>
          <select
            value={thutrongtuan}
            onChange={(e) => setThutrongtuan(Number(e.target.value))}
          >
            <option value={2}>Thứ 2</option>
            <option value={3}>Thứ 3</option>
            <option value={4}>Thứ 4</option>
            <option value={5}>Thứ 5</option>
            <option value={6}>Thứ 6</option>
            <option value={7}>Thứ 7</option>
            <option value={8}>Chủ nhật</option>
          </select>
        </div>
        <div className="field">
          <label>Tiết bắt đầu *</label>
          <input
            type="number"
            min={1}
            max={12}
            value={tietbatdau}
            onChange={(e) => setTietbatdau(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Tiết kết thúc *</label>
          <input
            type="number"
            min={1}
            max={12}
            value={tietketthuc}
            onChange={(e) => setTietketthuc(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ width: "100%" }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Đang kiểm tra..." : "Kiểm tra phòng trống"}
      </button>

      {result && result.checked && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 10,
            background: result.isConflict ? "#FFF5F5" : "#F0FDF4",
            border: result.isConflict
              ? "1px dashed #C25450"
              : "1px dashed #10B981",
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              color: result.isConflict ? "#991B1B" : "#065F46",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {result.isConflict ? "PHÒNG ĐÃ BỊ TRÙNG LỊCH" : "PHÒNG ĐANG TRỐNG"}
          </h4>
          <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#8B6F5F" }}>
            {result.isConflict
              ? `Phòng học bận vì có lớp đang giảng dạy vào thời điểm này:`
              : `Phòng học hoàn toàn trống và sẵn sàng để phân công giảng dạy.`}
          </p>

          {result.isConflict && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {result.conflicts.map((lh: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    background: "#fff",
                    border: "1px solid #EAD9CB",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <strong style={{ color: "#2D1B14" }}>
                    {lh.phancong?.monhoc?.tenmon ?? "—"}
                  </strong>
                  <div style={{ color: "#8B6F5F", marginTop: 2 }}>
                    Lớp: {lh.phancong?.lop?.tenlop ?? "—"} • Tiết:{" "}
                    {lh.tietbatdau}-{lh.tietketthuc}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timetable Visualizer ────────────────────────────────────────────────────

interface RoomTimetableModalProps {
  maphong: string;
  schedules: RoomSchedule[];
}

export function RoomTimetableModal({
  maphong,
  schedules,
}: RoomTimetableModalProps) {
  // Group schedules by thutrongtuan
  const grouped: Record<number, RoomSchedule[]> = {};
  [2, 3, 4, 5, 6, 7, 8].forEach((thu) => {
    grouped[thu] = schedules
      .filter((s) => s.thutrongtuan === thu)
      .sort((a, b) => a.tietbatdau - b.tietbatdau);
  });

  return (
    <div>
      <p style={{ marginBottom: 16 }}>
        Thời khóa biểu chi tiết trong học kỳ hiện tại của phòng{" "}
        <strong>{maphong}</strong>:
      </p>

      <div className="grid grid-cols-[80px_1fr] border border-[#EAD9CB] rounded-xl overflow-hidden bg-white">
        {[2, 3, 4, 5, 6, 7, 8].map((thu, index, arr) => {
          const isLast = index === arr.length - 1;
          const dayClasses = grouped[thu] || [];

          return (
            <div className="contents" key={thu}>
              <div
                className={`bg-[#FEFAE3] flex items-center justify-center font-bold text-[#2D1B14] border-r border-[#EAD9CB] p-3 ${
                  isLast ? "" : "border-b"
                }`}
              >
                {THU_LABELS[thu]}
              </div>
              <div
                className={`flex flex-col gap-1 p-3 bg-white ${
                  isLast ? "" : "border-b border-[#EAD9CB]"
                }`}
              >
                {dayClasses.length === 0 ? (
                  <span className="text-[#c0b0a0] italic text-xs py-1.5">
                    Không có lịch học
                  </span>
                ) : (
                  dayClasses.map((cl) => (
                    <div
                      key={cl.malichhoc}
                      className="bg-[#FFF5F5] border-l-4 border-[#C25450] rounded-lg p-2 px-3 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
                    >
                      <div className="font-bold text-[#2D1B14] mb-0.5">
                        {cl.monhoc}
                      </div>
                      <div className="text-[#8B6F5F]">
                        Tiết:{" "}
                        <strong>
                          {cl.tietbatdau}-{cl.tietketthuc}
                        </strong>{" "}
                        • Lớp: {cl.lop} • GV: {cl.giangvien}
                      </div>
                      {cl.ghichu && (
                        <div
                          style={{
                            fontSize: 10,
                            fontStyle: "italic",
                            marginTop: 2,
                            color: "#8B6F5F",
                          }}
                        >
                          * Ghi chú: {cl.ghichu}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
