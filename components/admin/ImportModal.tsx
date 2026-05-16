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
} from "@/services/service/import.service";
import styles from "./ImportModal.module.css";

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
      className={`${styles.cellInput} ${hasError ? styles.cellInputError : ""}`}
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
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Import sinh viên hàng loạt"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>Import Sinh Viên Hàng Loạt</h2>
              <p className={styles.subtitle}>
                {step === "upload" && "Kéo thả file Excel hoặc CSV"}
                {step === "preview" && `Xem trước & xác thực — ${fileName}`}
                {step === "importing" && "Đang nhập dữ liệu vào hệ thống…"}
                {step === "done" && "Hoàn tất"}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Steps indicator */}
        <div className={styles.steps}>
          {(["upload", "preview", "done"] as const).map((s, i) => (
            <div key={s} className={`${styles.step} ${step === s || (step === "importing" && s === "preview") || (step === "done" && s !== "upload") ? styles.stepActive : ""} ${(step === "preview" && s === "upload") || step === "done" ? styles.stepDone : ""}`}>
              <div className={styles.stepDot}>
                {((step === "preview" && s === "upload") || step === "done") && s !== (step === "done" ? "done" : "") ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span className={styles.stepLabel}>
                {s === "upload" ? "Tải file" : s === "preview" ? "Xác thực" : "Hoàn tất"}
              </span>
            </div>
          ))}
          <div className={styles.stepLine} />
        </div>

        {/* ── STEP: UPLOAD ── */}
        {step === "upload" && (
          <div className={styles.body}>
            {/* Drop zone */}
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""} ${validating ? styles.dropZoneLoading : ""}`}
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
                <div className={styles.dropZoneContent}>
                  <div className={styles.spinner} />
                  <p className={styles.dropZoneText}>Đang phân tích & xác thực dữ liệu…</p>
                </div>
              ) : (
                <div className={styles.dropZoneContent}>
                  <div className={styles.dropIcon}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className={styles.dropZoneText}>
                    <strong>Kéo thả file vào đây</strong> hoặc{" "}
                    <span className={styles.dropZoneLink}>chọn file</span>
                  </p>
                  <p className={styles.dropZoneSub}>
                    Hỗ trợ .xlsx, .xls, .csv — tối đa 1.000 sinh viên / lần
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Template download */}
            <div className={styles.templateBox}>
              <div className={styles.templateInfo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Tải file mẫu để đảm bảo đúng định dạng cột</span>
              </div>
              <button className={styles.templateBtn} onClick={downloadTemplate}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Tải file mẫu (.xlsx)
              </button>
            </div>

            {/* Column guide */}
            <div className={styles.columnGuide}>
              <p className={styles.columnGuideTitle}>Các cột trong file:</p>
              <div className={styles.columnList}>
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
                  <div key={col.name} className={styles.columnItem}>
                    <code className={col.name.includes("*") ? styles.colRequired : styles.colOptional}>
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
            <div className={styles.summaryBar}>
              <div className={styles.summaryStats}>
                <div className={styles.statChip}>
                  <span className={styles.statChipNum}>{summary.total}</span>
                  <span className={styles.statChipLabel}>Tổng dòng</span>
                </div>
                <div className={`${styles.statChip} ${styles.statChipGreen}`}>
                  <span className={styles.statChipNum}>{summary.valid}</span>
                  <span className={styles.statChipLabel}>Hợp lệ</span>
                </div>
                {summary.invalid > 0 && (
                  <div className={`${styles.statChip} ${styles.statChipRed}`}>
                    <span className={styles.statChipNum}>{summary.invalid}</span>
                    <span className={styles.statChipLabel}>Có lỗi</span>
                  </div>
                )}
              </div>

              <div className={styles.summaryActions}>
                <div className={styles.filterTabs}>
                  {(["all", "error", "valid"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`${styles.filterTab} ${filterMode === mode ? styles.filterTabActive : ""}`}
                      onClick={() => setFilterMode(mode)}
                    >
                      {mode === "all" ? "Tất cả" : mode === "error" ? `Lỗi (${summary.invalid})` : `Hợp lệ (${summary.valid})`}
                    </button>
                  ))}
                </div>
                <button
                  className={styles.reValidateBtn}
                  onClick={reValidate}
                  disabled={validating}
                  title="Chạy lại xác thực sau khi sửa"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={validating ? styles.spinning : ""}>
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  {validating ? "Đang kiểm tra…" : "Kiểm tra lại"}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorBanner} style={{ margin: "0 20px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thRow}>#</th>
                    <th>MSSV</th>
                    <th>Họ và Tên</th>
                    <th>Mã Lớp</th>
                    <th>Email ĐN</th>
                    <th>Mật Khẩu</th>
                    <th>Ngày Sinh</th>
                    <th>GT</th>
                    <th className={styles.thStatus}>Trạng thái</th>
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
                          className={hasError ? styles.rowError : hasWarning ? styles.rowWarning : styles.rowValid}
                        >
                          <td className={styles.tdRow}>
                            <span className={styles.rowNum}>{row.rowIndex}</span>
                          </td>

                          <td>
                            <EditableCell
                              value={row.masv}
                              onChange={(v) => updateCell(realIdx, "masv", v)}
                              hasError={row.errors.some((e) => e.toLowerCase().includes("mssv"))}
                              placeholder="VD: SV001"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.hoten}
                              onChange={(v) => updateCell(realIdx, "hoten", v)}
                              hasError={row.errors.some((e) => e.toLowerCase().includes("tên"))}
                              placeholder="Nguyễn Văn A"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.malop}
                              onChange={(v) => updateCell(realIdx, "malop", v)}
                              hasError={row.errors.some((e) => e.toLowerCase().includes("lớp") || e.toLowerCase().includes("lop"))}
                              placeholder="CNTT01"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.email}
                              onChange={(v) => updateCell(realIdx, "email", v)}
                              hasError={row.errors.some((e) => e.toLowerCase().includes("email đăng nhập") || e.toLowerCase().includes("email login"))}
                              placeholder="sv@gmail.com"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.matkhau}
                              onChange={(v) => updateCell(realIdx, "matkhau", v)}
                              hasError={row.errors.some((e) => e.toLowerCase().includes("mật khẩu"))}
                              placeholder="••••••"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.ngaysinh ?? ""}
                              onChange={(v) => updateCell(realIdx, "ngaysinh", v)}
                              placeholder="2003-05-15"
                            />
                          </td>
                          <td>
                            <EditableCell
                              value={row.gioitinh ?? ""}
                              onChange={(v) => updateCell(realIdx, "gioitinh", v)}
                              placeholder="Nam"
                            />
                          </td>

                          <td className={styles.tdStatus}>
                            {hasError ? (
                              <div className={styles.errorList}>
                                {row.errors.map((e, i) => (
                                  <div key={i} className={styles.errorItem}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M15 9l-6 6M9 9l6 6" stroke="white" strokeWidth="2" />
                                    </svg>
                                    {e}
                                  </div>
                                ))}
                                {row.warnings.map((w, i) => (
                                  <div key={`w${i}`} className={styles.warningItem}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                      <line x1="12" y1="9" x2="12" y2="13" stroke="white" strokeWidth="2" />
                                      <line x1="12" y1="17" x2="12.01" y2="17" stroke="white" strokeWidth="2" />
                                    </svg>
                                    {w}
                                  </div>
                                ))}
                              </div>
                            ) : hasWarning ? (
                              <div className={styles.errorList}>
                                {row.warnings.map((w, i) => (
                                  <div key={i} className={styles.warningItem}>⚠ {w}</div>
                                ))}
                              </div>
                            ) : (
                              <span className={styles.validBadge}>
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
            <div className={styles.footer}>
              <button
                className={styles.backBtn}
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                  setError("");
                }}
              >
                ← Chọn file khác
              </button>

              <div className={styles.footerRight}>
                {summary.invalid > 0 && (
                  <p className={styles.footerHint}>
                    {summary.invalid} dòng lỗi sẽ được bỏ qua. Chỉ{" "}
                    <strong>{summary.valid} dòng hợp lệ</strong> được nhập.
                  </p>
                )}
                <button
                  className={styles.confirmBtn}
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
          <div className={styles.body}>
            <div className={styles.importingState}>
              <div className={styles.importingSpinner} />
              <h3 className={styles.importingTitle}>Đang nhập dữ liệu…</h3>
              <p className={styles.importingSub}>
                Đang tạo {summary.valid} tài khoản và hồ sơ sinh viên.
                <br />Vui lòng không đóng cửa sổ này.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && doneResult && (
          <div className={styles.body}>
            <div className={styles.doneState}>
              <div className={`${styles.doneIcon} ${doneResult.failed === 0 ? styles.doneIconSuccess : styles.doneIconPartial}`}>
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

              <h3 className={styles.doneTitle}>
                {doneResult.failed === 0 ? "Import thành công!" : "Import hoàn tất với một số lỗi"}
              </h3>

              <div className={styles.doneSummary}>
                <div className={styles.doneStat}>
                  <span className={styles.doneStatNum + " " + styles.doneStatSuccess}>{doneResult.success}</span>
                  <span className={styles.doneStatLabel}>Sinh viên đã nhập</span>
                </div>
                {doneResult.failed > 0 && (
                  <div className={styles.doneStat}>
                    <span className={styles.doneStatNum + " " + styles.doneStatFail}>{doneResult.failed}</span>
                    <span className={styles.doneStatLabel}>Thất bại</span>
                  </div>
                )}
              </div>

              {doneResult.failedRows.length > 0 && (
                <div className={styles.failedList}>
                  <p className={styles.failedTitle}>Các dòng thất bại:</p>
                  {doneResult.failedRows.map((f) => (
                    <div key={f.rowIndex} className={styles.failedItem}>
                      <code>Dòng {f.rowIndex} · {f.masv}</code>
                      <span>{f.error}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.doneActions}>
                <button className={styles.backBtn} onClick={() => { setStep("upload"); setRows([]); setDoneResult(null); }}>
                  Import thêm
                </button>
                <button
                  className={styles.confirmBtn}
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