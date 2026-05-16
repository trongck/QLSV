import * as XLSX from "xlsx";
import type { ImportRow, ImportRowResult, BulkImportResponse } from "@/app/api/admin/sinhvien/bulk-import/route";
import { apiFetch } from "@/services/service/auth.service";


export type { ImportRow, ImportRowResult, BulkImportResponse };

// ─── Cột bắt buộc & mapping ───────────────────────────────────────────────────

const COLUMN_MAP: Record<string, keyof ImportRow> = {
  // Tiếng Việt không dấu / có dấu / tiếng Anh đều nhận
  "mssv": "masv",
  "ma sinh vien": "masv",
  "masv": "masv",
  "student id": "masv",

  "ho va ten": "hoten",
  "họ và tên": "hoten",
  "hoten": "hoten",
  "full name": "hoten",
  "ho ten": "hoten",

  "ma lop": "malop",
  "mã lớp": "malop",
  "malop": "malop",
  "class id": "malop",
  "lop": "malop",
  "lớp": "malop",

  "ngay sinh": "ngaysinh",
  "ngày sinh": "ngaysinh",
  "ngaysinh": "ngaysinh",
  "date of birth": "ngaysinh",
  "dob": "ngaysinh",

  "gioi tinh": "gioitinh",
  "giới tính": "gioitinh",
  "gioitinh": "gioitinh",
  "gender": "gioitinh",

  "email truong": "emailtruong",
  "email trường": "emailtruong",
  "emailtruong": "emailtruong",
  "school email": "emailtruong",

  "email": "email",
  "email dang nhap": "email",
  "email đăng nhập": "email",
  "login email": "email",

  "mat khau": "matkhau",
  "mật khẩu": "matkhau",
  "matkhau": "matkhau",
  "password": "matkhau",
};

// ─── Parse Excel/CSV file → ImportRow[] ──────────────────────────────────────

export function parseExcelFile(file: File): Promise<{
  rows: ImportRow[];
  rawHeaders: string[];
  sheetName: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
          raw: false,
          dateNF: "yyyy-mm-dd",
          defval: "",
        });

        if (raw.length === 0) {
          reject(new Error("File không có dữ liệu hoặc sheet trống."));
          return;
        }

        const rawHeaders = Object.keys(raw[0]);

        // Map cột về ImportRow keys
        const rows: ImportRow[] = raw.map((r) => {
          const mapped: Partial<ImportRow> = {};
          for (const [header, value] of Object.entries(r)) {
            const normalized = header.toLowerCase().trim();
            const field = COLUMN_MAP[normalized];
            if (field) {
              mapped[field] = String(value ?? "").trim();
            }
          }
          return mapped as ImportRow;
        });

        resolve({ rows, rawHeaders, sheetName });
      } catch (err) {
        reject(new Error("Không thể đọc file. Hãy kiểm tra định dạng Excel/CSV."));
      }
    };
    reader.onerror = () => reject(new Error("Lỗi đọc file."));
    reader.readAsArrayBuffer(file);
  });
}

// ─── Validate-only call ───────────────────────────────────────────────────────

export async function validateImportRows(rows: ImportRow[]): Promise<BulkImportResponse> {
  const res = await apiFetch("/api/admin/sinhvien/bulk-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, validateOnly: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Lỗi xác thực dữ liệu.");
  }

  return res.json();
}

// ─── Confirm import call ──────────────────────────────────────────────────────

export async function confirmImport(rows: ImportRow[]): Promise<{
  success: boolean;
  summary: { total: number; success: number; failed: number };
  failedRows: { rowIndex: number; masv: string; error: string }[];
}> {
  const res = await apiFetch("/api/admin/sinhvien/bulk-import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, validateOnly: false }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Lỗi nhập dữ liệu.");
  }

  return res.json();
}

// ─── Download template ────────────────────────────────────────────────────────

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const headers = [
    "MSSV", "Họ và Tên", "Mã Lớp", "Ngày Sinh",
    "Giới Tính", "Email Trường", "Email Đăng Nhập", "Mật Khẩu",
  ];

  const sampleData = [
    ["SV001", "Nguyễn Văn An", "CNTT01", "2003-05-15", "Nam", "sv001@truong.edu.vn", "sv001@gmail.com", "123456"],
    ["SV002", "Trần Thị Bình", "CNTT01", "2003-08-22", "Nu", "sv002@truong.edu.vn", "sv002@gmail.com", "123456"],
    ["SV003", "Lê Minh Châu", "CNTT02", "2003-03-10", "Nam", "", "sv003@gmail.com", "123456"],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

  // Style header row
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 18) }));

  XLSX.utils.book_append_sheet(wb, ws, "Danh Sách Sinh Viên");
  XLSX.writeFile(wb, "mau_import_sinhvien.xlsx");
}