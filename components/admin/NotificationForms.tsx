"use client";

import { useState } from "react";
import { LoaiThongBao, DoiTuongThongBao } from "@/types";
import type { ThongbaoRow } from "@/hooks/admin/useThongbao";
import type { LopRow } from "@/hooks/admin/useLop";
import type { PhanCongRow } from "@/hooks/admin/usePhancong";

export const NOTIFICATION_TYPE_LABEL: Record<LoaiThongBao, string> = {
  [LoaiThongBao.Chung]: "Chung",
  [LoaiThongBao.Hoctap]: "Học tập",
  [LoaiThongBao.Thoikhoabieu]: "Thời khóa biểu",
  [LoaiThongBao.Diem]: "Điểm số",
  [LoaiThongBao.Baitap]: "Bài tập",
  [LoaiThongBao.Tailieu]: "Tài liệu",
  [LoaiThongBao.Khancap]: "Khẩn cấp",
};

export const NOTIFICATION_TARGET_LABEL: Record<DoiTuongThongBao, string> = {
  [DoiTuongThongBao.Tatca]: "Tất cả",
  [DoiTuongThongBao.GiangVien]: "Giảng viên",
  [DoiTuongThongBao.SinhVien]: "Sinh viên",
};

export interface ParsedContent {
  imageUrl: string | null;
  text: string;
}

export function parseNotificationContent(noidung: string): ParsedContent {
  const match = noidung.match(/^\s*\[IMAGE_URL:([^\]]+)\]([\s\S]*)$/i);
  if (match) {
    const imageUrl = match[1].trim();
    let text = match[2];
    if (text.startsWith("\n")) {
      text = text.slice(1);
    } else if (text.startsWith("\r\n")) {
      text = text.slice(2);
    }
    return { imageUrl, text };
  }
  return {
    imageUrl: null,
    text: noidung,
  };
}

export function getNotificationStatus(
  ngaytao: string,
  ngayhethan: string | null,
): "Scheduled" | "Expired" | "Active" {
  const now = new Date();
  const formatted = ngaytao.replace(" ", "T");
  const parts = formatted.split("T");
  const [year, month, day] = parts[0].split("-").map(Number);
  const [hours, minutes] = (parts[1] ?? "00:00").split(":").map(Number);
  const pubDate = new Date(year, month - 1, day, hours, minutes);

  if (pubDate > now) return "Scheduled";
  if (ngayhethan) {
    const [eyear, emonth, eday] = ngayhethan.split("-").map(Number);
    const expDate = new Date(eyear, emonth - 1, eday, 23, 59, 59, 999);
    if (expDate < now) return "Expired";
  }
  return "Active";
}

// Format date-time for datetime-local input (YYYY-MM-DDTHH:MM) using literal parsing
export const formatDateTimeLocal = (isoString?: string) => {
  if (!isoString) return "";
  const formatted = isoString.replace(" ", "T");
  const parts = formatted.split("T");
  const datePart = parts[0];
  const timePart = parts[1]?.slice(0, 5) ?? "00:00";
  return `${datePart}T${timePart}`;
};

// Parse a local datetime string (YYYY-MM-DDTHH:MM) correctly into a literal SQL string
export const parseDateTimeLocalLiteral = (localStr: string): string => {
  return localStr.replace("T", " ") + ":00";
};

// ─── Notification Form ──────────────────────────────────────────────────────────

interface NotificationFormProps {
  initial?: Partial<ThongbaoRow>;
  lops: LopRow[];
  phancongs: PhanCongRow[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}

export function NotificationForm({
  initial,
  lops,
  phancongs,
  onSubmit,
  onCancel,
  loading,
  error,
}: NotificationFormProps) {
  const parsed = parseNotificationContent(initial?.noidung ?? "");

  const [form, setForm] = useState({
    tieude: initial?.tieude ?? "",
    noidung: parsed.text,
    imageUrl: parsed.imageUrl ?? "",
    loai: initial?.loai ?? "Chung",
    doituong: initial?.doituong ?? "Tatca",
    malop: initial?.malop ?? "",
    maphancong: initial?.maphancong ?? "",
    ngayhethan: initial?.ngayhethan?.split("T")[0] ?? "",
    ngaytao: initial?.ngaytao ? formatDateTimeLocal(initial.ngaytao) : "",
    ghim: initial?.ghim ?? false,
  });

  const [imageMode, setImageMode] = useState<"upload" | "url">(
    parsed.imageUrl?.startsWith("data:") ? "upload" : "url",
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF,...)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("Dung lượng ảnh tối đa là 3MB để tối ưu hóa lưu trữ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setForm((prev) => ({ ...prev, imageUrl: base64Str }));
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = () => {
    const finalNoidung = form.imageUrl.trim()
      ? `[IMAGE_URL:${form.imageUrl.trim()}]\n${form.noidung}`
      : form.noidung;

    onSubmit({
      tieude: form.tieude,
      noidung: finalNoidung,
      loai: form.loai,
      doituong: form.doituong,
      malop: form.malop,
      maphancong: form.maphancong,
      ngayhethan: form.ngayhethan || null,
      ghim: form.ghim,
      ngaytao: form.ngaytao
        ? parseDateTimeLocalLiteral(form.ngaytao)
        : undefined,
    });
  };

  return (
    <>
      {error && <div className="error-msg">{error}</div>}
      <div className="form-grid">
        <div className="field full">
          <label>Tiêu đề thông báo *</label>
          <input
            value={form.tieude}
            onChange={(e) => setForm({ ...form, tieude: e.target.value })}
            placeholder="Nhập tiêu đề ngắn gọn..."
          />
        </div>
        <div className="field">
          <label>Loại thông báo</label>
          <select
            value={form.loai}
            onChange={(e) => setForm({ ...form, loai: e.target.value })}
          >
            {Object.values(LoaiThongBao).map((type) => (
              <option key={type} value={type}>
                {NOTIFICATION_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Ngày hết hạn (Tuỳ chọn)</label>
          <input
            type="date"
            value={form.ngayhethan}
            onChange={(e) => setForm({ ...form, ngayhethan: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Đối tượng nhận</label>
          <select
            value={form.doituong}
            onChange={(e) => setForm({ ...form, doituong: e.target.value })}
          >
            {Object.values(DoiTuongThongBao).map((tgt) => (
              <option key={tgt} value={tgt}>
                {NOTIFICATION_TARGET_LABEL[tgt]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Gửi cho Lớp (Tuỳ chọn)</label>
          <select
            value={form.malop}
            onChange={(e) => setForm({ ...form, malop: e.target.value })}
          >
            <option value="">-- Tất cả các lớp --</option>
            {lops.map((l) => (
              <option key={l.malop} value={l.malop}>
                {l.tenlop} ({l.malop})
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>Gắn với Mã phân công (Tuỳ chọn)</label>
          <select
            value={form.maphancong}
            onChange={(e) => setForm({ ...form, maphancong: e.target.value })}
          >
            <option value="">-- Không gắn --</option>
            {phancongs.map((p) => (
              <option key={p.maphancong} value={p.maphancong}>
                [{p.maphancong}] {p.monhoc?.tenmon} - {p.giangvien?.hoten} (
                {p.lop?.tenlop})
              </option>
            ))}
          </select>
        </div>

        {/* Hình ảnh đính kèm */}
        <div
          className="field full"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <label style={{ fontWeight: 600, color: "#2D1B14" }}>
            Hình ảnh đính kèm (Tuỳ chọn)
          </label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
            <button
              type="button"
              className={
                imageMode === "upload" ? "btn-primary" : "btn-secondary"
              }
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                borderRadius: "8px",
              }}
              onClick={() => setImageMode("upload")}
            >
              📁 Tải ảnh lên từ tệp
            </button>
            <button
              type="button"
              className={imageMode === "url" ? "btn-primary" : "btn-secondary"}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                borderRadius: "8px",
              }}
              onClick={() => setImageMode("url")}
            >
              🔗 Nhập đường dẫn ảnh (URL)
            </button>
          </div>

          {imageMode === "upload" ? (
            <div
              style={{
                border: "2px dashed #FFDBB6",
                borderRadius: "12px",
                padding: "24px 16px",
                textAlign: "center",
                background: "#FFFDF9",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
              onClick={() =>
                document.getElementById("img-upload-input")?.click()
              }
            >
              <input
                id="img-upload-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  margin: "0 auto 8px",
                  display: "block",
                  color: "#C25450",
                }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span
                style={{ fontSize: "13px", color: "#8B6F5F", fontWeight: 500 }}
              >
                {form.imageUrl.startsWith("data:")
                  ? "✓ Đã tải ảnh lên thành công"
                  : "Nhấp vào đây để chọn ảnh từ máy của bạn"}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#A08070",
                  marginTop: "4px",
                }}
              >
                Hỗ trợ PNG, JPG, WEBP, GIF (Tối đa 3MB)
              </span>
            </div>
          ) : (
            <input
              value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="Ví dụ: https://images.unsplash.com/... hoặc đường dẫn ảnh bất kỳ"
            />
          )}

          {form.imageUrl.trim() && (
            <div
              style={{
                marginTop: "8px",
                background: "#FFFBF2",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #FFDBB6",
                display: "flex",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#8B6F5F",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Xem trước ảnh đính kèm:
                </span>
                <img
                  src={form.imageUrl.trim()}
                  alt="Xem trước ảnh đính kèm"
                  style={{
                    display: "block",
                    maxHeight: "120px",
                    borderRadius: "8px",
                    border: "1px solid #FFDBB6",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  color: "#C25450",
                  border: "1.5px solid #C25450",
                  background: "#FFF0F0",
                }}
                onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
              >
                🗑️ Gỡ bỏ ảnh
              </button>
            </div>
          )}
        </div>

        {/* Lên lịch phát sóng */}
        <div className="field full">
          <label>Hẹn giờ phát sóng thông báo (Hẹn giờ gửi - Tuỳ chọn)</label>
          <input
            type="datetime-local"
            value={form.ngaytao}
            onChange={(e) => setForm({ ...form, ngaytao: e.target.value })}
          />
          <span
            style={{
              fontSize: "11px",
              color: "#8B6F5F",
              marginTop: "4px",
              display: "block",
            }}
          >
            Để trống để đăng ngay lập tức. Chọn một thời điểm trong tương lai để
            lên lịch phát tự động.
          </span>
        </div>

        <div className="field full">
          <label>Nội dung chi tiết *</label>
          <textarea
            rows={5}
            value={form.noidung}
            onChange={(e) => setForm({ ...form, noidung: e.target.value })}
            placeholder="Nhập nội dung thông báo..."
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
              checked={form.ghim}
              onChange={(e) => setForm({ ...form, ghim: e.target.checked })}
            />
            Ghim thông báo lên đầu danh sách
          </label>
        </div>
      </div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={loading}>
          Huỷ
        </button>
        <button
          className="btn-primary"
          onClick={handleFormSubmit}
          disabled={loading || !form.tieude.trim() || !form.noidung.trim()}
        >
          {loading
            ? "Đang gửi..."
            : initial?.mathongbao
              ? "Cập nhật"
              : "Đăng thông báo"}
        </button>
      </div>
    </>
  );
}
