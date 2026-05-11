"use client";

import { useCallback, useRef, useState } from "react";
import {
  parseExcelFile,
  validateImportRows,
  confirmImport,
  downloadTemplate,
  type ImportRow,
  type ImportRowResult,
  type BulkImportResponse,
} from "@/services/service/admin/sinhvien.services/import.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "upload" | "preview" | "importing" | "done";

interface Props {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

// ─── Cell editor ─────────────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  hasError,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      className={`w-full min-w-[80px] p-[5px_8px] border-[1.5px] rounded-md text-xs font-inherit bg-transparent text-[#2D1B14] outline-none transition-all duration-150 hover:border-[#EAD9CB] hover:bg-white focus:border-primary focus:bg-white ${hasError ? "border-[#FECACA_!important] bg-[#FFF5F5_!important]" : "border-transparent"}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImportModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [rows, setRows] = useState<ImportRowResult[]>([]);
  const [summary, setSummary] = useState({ total: 0, valid: 0, invalid: 0 });
  const [filterMode, setFilterMode] = useState<"all" | "error" | "valid">("all");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  // Done state
  const [doneResult, setDoneResult] = useState<{
    success: number;
    failed: number;
    failedRows: { rowIndex: number; masv: string; error: string }[];
  } | null>(null);

  // ── File processing ─────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      setError("Chỉ chấp nhận file .xlsx, .xls hoặc .csv");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File quá lớn (tối đa 10MB)");
      return;
    }

    setError("");
    setValidating(true);

    try {
      const { rows: parsed } = await parseExcelFile(file);
      if (parsed.length === 0) {
        setError("File không có dữ liệu.");
        setValidating(false);
        return;
      }
      if (parsed.length > 1000) {
        setError("Tối đa 1000 sinh viên mỗi lần import.");
        setValidating(false);
        return;
      }

      setFileName(file.name);

      const result: BulkImportResponse = await validateImportRows(parsed);
      setRows(result.results);
      setSummary(result.summary);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xử lý file.");
    } finally {
      setValidating(false);
    }
  }, []);

  // ── Drag & Drop handlers ────────────────────────────────────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  // ── Cell edit ───────────────────────────────────────────────────────────────

  const updateCell = (rowIdx: number, field: keyof ImportRow, value: string) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIdx) return r;
        return { ...r, [field]: value };
      })
    );
  };

  // ── Re-validate after edits ─────────────────────────────────────────────────

  const reValidate = async () => {
    setValidating(true);
    setError("");
    try {
      const toValidate: ImportRow[] = rows.map((r) => ({
        masv: r.masv,
        hoten: r.hoten,
        malop: r.malop,
        ngaysinh: r.ngaysinh,
        gioitinh: r.gioitinh,
        emailtruong: r.emailtruong,
        email: r.email,
        matkhau: r.matkhau,
      }));
      const result = await validateImportRows(toValidate);
      setRows(result.results);
      setSummary(result.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi xác thực.");
    } finally {
      setValidating(false);
    }
  };

  // ── Confirm import ──────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (summary.valid === 0) return;
    setStep("importing");
    try {
      const validRows: ImportRow[] = rows
        .filter((r) => r.valid)
        .map((r) => ({
          masv: r.masv,
          hoten: r.hoten,
          malop: r.malop,
          ngaysinh: r.ngaysinh,
          gioitinh: r.gioitinh,
          emailtruong: r.emailtruong,
          email: r.email,
          matkhau: r.matkhau,
        }));

      const result = await confirmImport(validRows);
      setDoneResult({
        success: result.summary.success,
        failed: result.summary.failed,
        failedRows: result.failedRows ?? [],
      });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi nhập dữ liệu.");
      setStep("preview");
    }
  };

  // ── Filter rows for display ─────────────────────────────────────────────────

  const displayRows =
    filterMode === "error"
      ? rows.filter((r) => !r.valid)
      : filterMode === "valid"
      ? rows.filter((r) => r.valid)
      : rows;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-[#2D1B14]/50 backdrop-blur-[4px] z-[500] flex items-center justify-center p-5 animate-fadeIn max-md:p-0 max-md:items-end" onClick={onClose}>
      <div
        className="bg-[#FFFDF8] rounded-[20px] w-full max-w-[1100px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(45,27,20,0.2)] animate-slideUp max-md:max-h-[95vh] max-md:rounded-[20px_20px_0_0]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import sinh viên hàng loạt"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-[20px_24px_16px] border-b border-[#EAD9CB] bg-[#FBD9D9] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center text-primary shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#2D1B14] m-0">Import Sinh Viên Hàng Loạt</h2>
              <p className="text-xs text-[#8B6F5F] m-0 mt-0.5">
                {step === "upload" && "Kéo thả file Excel hoặc CSV"}
                {step === "preview" && `Xem trước & xác thực — ${fileName}`}
                {step === "importing" && "Đang nhập dữ liệu vào hệ thống…"}
                {step === "done" && "Hoàn tất"}
              </p>
            </div>
          </div>
          <button className="w-[34px] h-[34px] rounded-lg bg-[#2D1B14]/6 border-none cursor-pointer flex items-center justify-center text-[#5C3D1E] transition-all duration-150 hover:bg-primary/15 shrink-0" onClick={onClose} aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 p-[14px_24px] bg-[#FFF8F5] border-b border-[#EAD9CB] relative shrink-0">
          {(["upload", "preview", "done"] as const).map((s, i) => {
            const isActive = step === s || (step === "importing" && s === "preview") || (step === "done" && s !== "upload");
            const isDone = (step === "preview" && s === "upload") || step === "done";
            return (
              <div key={s} className={`flex items-center gap-2 flex-1 z-10 ${isActive ? "text-primary font-semibold" : ""} ${isDone ? "text-green-800" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 shrink-0 ${isActive ? "bg-primary text-white shadow-[0_0_0_3px_rgba(194,84,80,0.2)]" : isDone ? "bg-green-800 text-white" : "bg-[#EAD9CB] text-[#8B6F5F]"}`}>
                  {(isDone && s !== (step === "done" ? "done" : "")) ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? "text-primary font-semibold" : isDone ? "text-green-800" : "text-[#8B6F5F]"}`}>
                  {s === "upload" ? "Tải file" : s === "preview" ? "Xác thực" : "Hoàn tất"}
                </span>
              </div>
            );
          })}
          <div className="absolute top-1/2 left-[80px] right-[80px] h-[1px] bg-[#EAD9CB] z-0" />
        </div>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div className="p-6 overflow-y-auto flex-1">
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-2xl p-[48px_32px] text-center cursor-pointer transition-all duration-200 bg-[#FEFAE3] select-none hover:border-primary hover:bg-[#FFF5F5] ${isDragging ? "border-primary bg-[#FFF5F5]" : "border-[#EAD9CB]"} ${validating ? "cursor-wait opacity-70" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !validating && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileInput}
              />

              {validating ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-9 h-9 border-[3px] border-[#EAD9CB] border-t-primary rounded-full animate-spin" />
                  <p className="text-base text-[#2D1B14] m-0">Đang phân tích & xác thực dữ liệu…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className={`text-primary transition-all duration-200 ${isDragging ? "opacity-100 scale-110" : "opacity-70"}`}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="text-base text-[#2D1B14] m-0">
                    <strong>Kéo thả file vào đây</strong> hoặc{" "}
                    <span className="text-primary underline font-semibold">chọn file</span>
                  </p>
                  <p className="text-xs text-[#8B6F5F] m-0">
                    Hỗ trợ .xlsx, .xls, .csv — tối đa 1.000 sinh viên / lần
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-[10px_16px] bg-[#FEE2E2] border border-[#FECACA] rounded-[10px] text-[13px] text-[#B91C1C] mt-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Template download */}
            <div className="flex items-center justify-between p-[12px_16px] bg-[#FFF0CD] border border-[#FFDBB6] rounded-[12px] mt-5 gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[13px] text-[#5C3D1E]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Tải file mẫu để đảm bảo đúng định dạng cột</span>
              </div>
              <button className="flex items-center gap-1.5 p-[8px_16px] bg-white border-[1.5px] border-[#FFDBB6] rounded-lg text-[13px] text-[#5C3D1E] font-semibold cursor-pointer font-inherit transition-all duration-150 hover:bg-[#FFF0CD] whitespace-nowrap" onClick={downloadTemplate}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Tải file mẫu (.xlsx)
              </button>
            </div>

            {/* Column guide */}
            <div className="mt-5">
              <p className="text-xs font-bold text-[#8B6F5F] uppercase tracking-[0.06em] m-0 mb-2.5">Các cột trong file:</p>
              <div className="grid grid-cols-[repeat(auto-fill,_minmax(240px,_1fr))] gap-2">
                {[
                  { name: "MSSV *", desc: "Mã số sinh viên" },
                  { name: "Họ và Tên *", desc: "Họ và tên đầy đủ" },
                  { name: "Mã Lớp *", desc: "Phải tồn tại trong hệ thống" },
                  { name: "Email Đăng Nhập *", desc: "Email để đăng nhập" },
                  { name: "Mật Khẩu *", desc: "Tối thiểu 6 ký tự" },
                  { name: "Ngày Sinh", desc: "Định dạng YYYY-MM-DD" },
                  { name: "Giới Tính", desc: "Nam / Nu / Khac" },
                  { name: "Email Trường", desc: "Email @truong.edu.vn" },
                ].map((col) => (
                  <div key={col.name} className="flex items-center gap-2 text-xs text-[#5C3D1E]">
                    <code className={`text-[11px] font-bold p-[2px_7px] rounded whitespace-nowrap ${col.name.includes("*") ? "bg-[#FBD9D9] text-[#C25450]" : "bg-gray-100 text-gray-500"}`}>
                      {col.name}
                    </code>
                    <span>{col.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === "preview" && (
          <>
            {/* Summary bar */}
            <div className="flex items-center justify-between p-[12px_20px] bg-[#FFF8F5] border-b border-[#EAD9CB] gap-3 flex-wrap shrink-0 max-md:flex-col max-md:items-start">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 p-[5px_12px] rounded-full bg-gray-100 border border-gray-200">
                  <span className="text-base font-bold line-height-1 text-[#2D1B14]">{summary.total}</span>
                  <span className="text-[11px] text-[#6B7280] font-medium">Tổng dòng</span>
                </div>
                <div className="flex items-center gap-1.5 p-[5px_12px] rounded-full bg-[#D1FAE5] border border-[rgba(4,120,87,0.2)] text-[#047857]">
                  <span className="text-base font-bold line-height-1 text-[#047857]">{summary.valid}</span>
                  <span className="text-[11px] text-[#047857] font-medium">Hợp lệ</span>
                </div>
                {summary.invalid > 0 && (
                  <div className="flex items-center gap-1.5 p-[5px_12px] rounded-full bg-[#FEE2E2] border border-[rgba(185,28,28,0.2)] text-[#B91C1C]">
                    <span className="text-base font-bold line-height-1 text-[#B91C1C]">{summary.invalid}</span>
                    <span className="text-[11px] text-[#B91C1C] font-medium">Có lỗi</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex bg-[#EAD9CB] rounded-lg p-[3px] gap-0.5">
                  {(["all", "error", "valid"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`p-[5px_12px] border-none rounded-md text-xs font-medium bg-transparent cursor-pointer font-inherit transition-all duration-150 whitespace-nowrap ${filterMode === mode ? "bg-white text-[#2D1B14] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#6B4F3F] hover:bg-white/50"}`}
                      onClick={() => setFilterMode(mode)}
                    >
                      {mode === "all" ? "Tất cả" : mode === "error" ? `Lỗi (${summary.invalid})` : `Hợp lệ (${summary.valid})`}
                    </button>
                  ))}
                </div>
                <button
                  className="flex items-center gap-1.5 p-[7px_14px] border-[1.5px] border-[#EAD9CB] rounded-lg text-xs font-semibold text-[#5C3D1E] bg-white cursor-pointer font-inherit transition-all duration-150 hover:enabled:border-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  onClick={reValidate}
                  disabled={validating}
                  title="Chạy lại xác thực sau khi sửa"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={validating ? "animate-spin" : ""}>
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  {validating ? "Đang kiểm tra…" : "Kiểm tra lại"}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-[10px_16px] bg-[#FEE2E2] border border-[#FECACA] rounded-[10px] text-[13px] text-[#B91C1C] mt-4" style={{ margin: "0 20px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Table */}
            <div className="overflow-auto flex-1 border-b border-[#EAD9CB]">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2] w-10 text-center">#</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">MSSV</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">Họ và Tên</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">Mã Lớp</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">Email ĐN</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">Mật Khẩu</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">Ngày Sinh</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2]">GT</th>
                    <th className="sticky top-0 bg-[#FFF0CD] p-[10px_8px] text-left text-[11px] font-700 text-[#6B4F3F] uppercase tracking-[0.05em] border-b-2 border-[#FFDBB6] whitespace-nowrap z-[2] min-w-[200px]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#8B6F5F", fontSize: "13px" }}>
                        {filterMode === "error" ? "Không có dòng lỗi 🎉" : "Không có dòng hợp lệ"}
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row, displayIdx) => {
                      const realIdx = rows.findIndex((r) => r.rowIndex === row.rowIndex);
                      const hasError = !row.valid;
                      const hasWarning = row.warnings.length > 0;

                      return (
                        <tr
                          key={row.rowIndex}
                          className={`border-b border-gray-100 transition-all duration-100 hover:bg-[#FEFAE3] ${hasError ? "bg-[#FFF5F5_!important]" : hasWarning ? "bg-[#FFFBEB_!important]" : ""}`}
                        >
                          <td className="text-center p-[6px_8px] vertical-align-top">
                            <span className={`inline-block min-w-[22px] h-[22px] line-height-[22px] text-center rounded-full text-[10px] font-bold ${hasError ? "bg-[#FECACA] text-[#B91C1C]" : !hasError ? "bg-[#D1FAE5] text-[#047857]" : "bg-[#EAD9CB] text-[#6B4F3F]"}`}>{row.rowIndex}</span>
                          </td>

                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.masv}
                               onChange={(v) => updateCell(realIdx, "masv", v)}
                               hasError={row.errors.some((e) => e.toLowerCase().includes("mssv"))}
                               placeholder="VD: SV001"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.hoten}
                               onChange={(v) => updateCell(realIdx, "hoten", v)}
                               hasError={row.errors.some((e) => e.toLowerCase().includes("tên"))}
                               placeholder="Nguyễn Văn A"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.malop}
                               onChange={(v) => updateCell(realIdx, "malop", v)}
                               hasError={row.errors.some((e) => e.toLowerCase().includes("lớp") || e.toLowerCase().includes("lop"))}
                               placeholder="CNTT01"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.email}
                               onChange={(v) => updateCell(realIdx, "email", v)}
                               hasError={row.errors.some((e) => e.toLowerCase().includes("email đăng nhập") || e.toLowerCase().includes("email login"))}
                               placeholder="sv@gmail.com"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.matkhau}
                               onChange={(v) => updateCell(realIdx, "matkhau", v)}
                               hasError={row.errors.some((e) => e.toLowerCase().includes("mật khẩu"))}
                               placeholder="••••••"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.ngaysinh ?? ""}
                               onChange={(v) => updateCell(realIdx, "ngaysinh", v)}
                               placeholder="2003-05-15"
                            />
                          </td>
                          <td className="p-[6px_8px] vertical-align-top">
                            <EditableCell
                               value={row.gioitinh ?? ""}
                               onChange={(v) => updateCell(realIdx, "gioitinh", v)}
                               placeholder="Nam"
                            />
                          </td>

                          <td className="vertical-align-top p-[6px_8px]">
                            {hasError ? (
                              <div className="flex flex-col gap-[3px]">
                                {row.errors.map((e, i) => (
                                  <div key={i} className="flex items-start gap-1 text-[11px] text-[#B91C1C] leading-[1.4]">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" />
                                    </svg>
                                    {e}
                                  </div>
                                ))}
                                {row.warnings.map((w, i) => (
                                  <div key={`w${i}`} className="flex items-start gap-1 text-[11px] text-[#92400E] leading-[1.4]">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 mt-0.5">
                                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" />
                                      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" />
                                    </svg>
                                    {w}
                                  </div>
                                ))}
                              </div>
                            ) : hasWarning ? (
                              <div className="flex flex-col gap-[3px]">
                                {row.warnings.map((w, i) => (
                                  <div key={i} className="flex items-start gap-1 text-[11px] text-[#92400E] leading-[1.4]">⚠ {w}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] p-[3px_8px] bg-[#D1FAE5] rounded-full">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>


            {/* Footer actions */}
            <div className="flex items-center justify-between p-[16px_20px] bg-[#FFF8F5] border-t border-[#EAD9CB] gap-3 shrink-0 flex-wrap max-md:flex-col max-md:items-stretch">
              <button
                className="p-[9px_18px] border-[1.5px] border-[#EAD9CB] rounded-[10px] text-[13px] text-[#5C3D1E] bg-white cursor-pointer font-inherit font-medium transition-all duration-150 hover:border-primary hover:text-primary max-md:text-center"
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setError("");
                }}
              >
                ← Chọn file khác
              </button>

              <div className="flex items-center gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
                {summary.invalid > 0 && (
                  <p className="text-xs text-[#8B6F5F] m-0">
                    {summary.invalid} dòng lỗi sẽ được bỏ qua. Chỉ{" "}
                    <strong>{summary.valid} dòng hợp lệ</strong> được nhập.
                  </p>
                )}
                <button
                  className="flex items-center gap-2 p-[9px_20px] bg-primary text-white border-none rounded-[10px] text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 hover:enabled:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap max-md:justify-center"
                  onClick={handleConfirm}
                  disabled={summary.valid === 0 || validating}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Xác nhận nhập {summary.valid} sinh viên
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP: IMPORTING ── */}
        {step === "importing" && (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col items-center justify-center p-[60px_32px] gap-4 text-center">
              <div className="w-14 h-14 border-4 border-[#EAD9CB] border-t-primary rounded-full animate-spin" />
              <h3 className="text-xl font-bold text-[#2D1B14] m-0">Đang nhập dữ liệu…</h3>
              <p className="text-sm text-[#8B6F5F] m-0 leading-relaxed">
                Đang tạo {summary.valid} tài khoản và hồ sơ sinh viên.
                <br />Vui lòng không đóng cửa sổ này.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && doneResult && (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex flex-col items-center p-[40px_32px] gap-5 text-center">
              <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center ${doneResult.failed === 0 ? "bg-[#D1FAE5] text-[#047857]" : "bg-[#FFF3CD] text-[#92400E]"}`}>
                {doneResult.failed === 0 ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-bold text-[#2D1B14] m-0">
                {doneResult.failed === 0 ? "Import thành công!" : "Import hoàn tất với một số lỗi"}
              </h3>

              <div className="flex gap-6 justify-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[40px] font-extrabold line-height-1 text-[#047857]">{doneResult.success}</span>
                  <span className="text-xs text-[#8B6F5F]">Sinh viên đã nhập</span>
                </div>
                {doneResult.failed > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[40px] font-extrabold line-height-1 text-[#B91C1C]">{doneResult.failed}</span>
                    <span className="text-xs text-[#8B6F5F]">Thất bại</span>
                  </div>
                )}
              </div>

              {doneResult.failedRows.length > 0 && (
                <div className="w-full max-w-[600px] bg-[#FFF5F5] border border-[#FECACA] rounded-xl p-[12px_16px] text-left">
                  <p className="text-xs font-bold text-[#B91C1C] uppercase tracking-[0.05em] m-0 mb-2">Các dòng thất bại:</p>
                  {doneResult.failedRows.map((f) => (
                    <div key={f.rowIndex} className="flex items-start gap-2.5 p-[6px_0] border-b border-[#FECACA] text-xs last:border-b-0">
                      <code className="color-[#B91C1C] font-semibold whitespace-nowrap shrink-0">Dòng {f.rowIndex} · {f.masv}</code>
                      <span className="text-[#5C3D1E]">{f.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button className="p-[9px_18px] border-[1.5px] border-[#EAD9CB] rounded-[10px] text-[13px] text-[#5C3D1E] bg-white cursor-pointer font-inherit font-medium transition-all duration-150 hover:border-primary hover:text-primary max-md:text-center" onClick={() => { setStep("upload"); setRows([]); setDoneResult(null); }}>
                  Import thêm
                </button>
                <button
                  className="flex items-center gap-2 p-[9px_20px] bg-primary text-white border-none rounded-[10px] text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 hover:enabled:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap max-md:justify-center"
                  onClick={() => { onSuccess(doneResult.success); onClose(); }}
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}