import { useCallback } from "react";
import { apiFetch } from "@/services/service/auth/auth.service";

export interface ImportRow {
  masv: string;
  hoten: string;
  malop: string;
  ngaysinh?: string;
  gioitinh?: string;
  emailtruong?: string;
  email: string;
  matkhau: string;
}

export interface ImportRowResult extends ImportRow {
  rowIndex: number;
  errors: string[];
  warnings: string[];
  valid: boolean;
}

export interface BulkImportResponse {
  results: ImportRowResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export function useImportSinhvien() {
  const validateImportRows = useCallback(async (rows: ImportRow[]): Promise<BulkImportResponse> => {
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
  }, []);

  const confirmImport = useCallback(
    async (
      rows: ImportRow[]
    ): Promise<{
      success: boolean;
      summary: { total: number; success: number; failed: number };
      failedRows: { rowIndex: number; masv: string; error: string }[];
    }> => {
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
    },
    []
  );

  return {
    validateImportRows,
    confirmImport,
  };
}
