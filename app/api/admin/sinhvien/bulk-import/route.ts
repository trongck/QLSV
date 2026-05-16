import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import { verifyToken, extractBearer } from "@/lib/utils/jwt";
import { VaiTro } from "@/types";
import { logAuditAction } from "@/lib/utils/audit";

async function requireAdmin(request: Request) {
  const token = extractBearer(request.headers.get("authorization"));
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.vaitro === VaiTro.Admin ? payload : null;
  } catch {
    return null;
  }
}

// ─── POST /api/admin/sinhvien/bulk-import ─────────────────────────────────────
// Body: { rows: ImportRow[] }
// Phase 1 (validate=true): Chỉ validate, không ghi DB → trả về rows kèm lỗi
// Phase 2 (validate=false): Ghi DB những row hợp lệ

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

export async function POST(request: Request) {
  const adminPayload = await requireAdmin(request);
  if (!adminPayload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { rows, validateOnly = true }: { rows: ImportRow[]; validateOnly?: boolean } = body;

  if (!Array.isArray(rows) || rows.length === 0)
    return NextResponse.json({ error: "Không có dữ liệu để xử lý." }, { status: 400 });

  if (rows.length > 1000)
    return NextResponse.json({ error: "Tối đa 1000 sinh viên mỗi lần import." }, { status: 400 });

  const supabase = createClient(await cookies());

  // ── Prefetch dữ liệu để validate ──────────────────────────────────────────
  const [
    { data: existingSV },
    { data: existingTK },
    { data: allLops },
  ] = await Promise.all([
    supabase.from("sinhvien").select("masv").in("masv", rows.map(r => r.masv)),
    supabase.from("taikhoan").select("email").in("email", rows.map(r => r.email).filter(Boolean)),
    supabase.from("lop").select("malop, tenlop"),
  ]);

  const existingMaSV = new Set((existingSV ?? []).map(r => r.masv));
  const existingEmails = new Set((existingTK ?? []).map(r => r.email));
  const validLops = new Set((allLops ?? []).map(r => r.malop));
  const lopMap = Object.fromEntries((allLops ?? []).map(r => [r.malop, r.tenlop]));

  // Track duplicates trong batch
  const seenMaSV = new Map<string, number>();
  const seenEmail = new Map<string, number>();

  // ── Validate từng row ─────────────────────────────────────────────────────
  const results: ImportRowResult[] = rows.map((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rowIndex = idx + 2; // Excel row (header = 1)

    // MSSV
    if (!row.masv?.trim()) {
      errors.push("MSSV không được để trống.");
    } else {
      const masv = row.masv.trim();
      if (existingMaSV.has(masv)) {
        errors.push(`MSSV "${masv}" đã tồn tại trong hệ thống.`);
      }
      if (seenMaSV.has(masv)) {
        errors.push(`MSSV "${masv}" bị trùng với dòng ${seenMaSV.get(masv)! + 2} trong file.`);
      } else {
        seenMaSV.set(masv, idx);
      }
    }

    // Họ tên
    if (!row.hoten?.trim()) {
      errors.push("Họ tên không được để trống.");
    } else if (row.hoten.trim().length < 3) {
      errors.push("Họ tên quá ngắn (tối thiểu 3 ký tự).");
    }

    // Lớp
    if (!row.malop?.trim()) {
      errors.push("Mã lớp không được để trống.");
    } else if (!validLops.has(row.malop.trim())) {
      errors.push(`Lớp "${row.malop}" không tồn tại trong hệ thống.`);
    }

    // Email đăng nhập
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!row.email?.trim()) {
      errors.push("Email đăng nhập không được để trống.");
    } else if (!emailRegex.test(row.email.trim())) {
      errors.push(`Email "${row.email}" không đúng định dạng.`);
    } else {
      const email = row.email.trim();
      if (existingEmails.has(email)) {
        errors.push(`Email "${email}" đã được dùng bởi tài khoản khác.`);
      }
      if (seenEmail.has(email)) {
        errors.push(`Email "${email}" bị trùng với dòng ${seenEmail.get(email)! + 2} trong file.`);
      } else {
        seenEmail.set(email, idx);
      }
    }

    // Mật khẩu
    if (!row.matkhau?.trim()) {
      errors.push("Mật khẩu không được để trống.");
    } else if (row.matkhau.trim().length < 6) {
      errors.push("Mật khẩu tối thiểu 6 ký tự.");
    }

    // Email trường (tuỳ chọn)
    if (row.emailtruong?.trim() && !emailRegex.test(row.emailtruong.trim())) {
      warnings.push(`Email trường "${row.emailtruong}" không đúng định dạng — sẽ bỏ qua.`);
    }

    // Ngày sinh (tuỳ chọn)
    if (row.ngaysinh?.trim()) {
      const d = new Date(row.ngaysinh);
      if (isNaN(d.getTime())) {
        warnings.push(`Ngày sinh "${row.ngaysinh}" không hợp lệ — sẽ bỏ qua.`);
      }
    }

    // Giới tính
    if (row.gioitinh?.trim() && !["Nam", "Nu", "Khac"].includes(row.gioitinh.trim())) {
      warnings.push(`Giới tính "${row.gioitinh}" không hợp lệ — nhận Nam/Nu/Khac. Sẽ bỏ qua.`);
    }

    return {
      ...row,
      masv: row.masv?.trim() ?? "",
      hoten: row.hoten?.trim() ?? "",
      malop: row.malop?.trim() ?? "",
      email: row.email?.trim() ?? "",
      matkhau: row.matkhau?.trim() ?? "",
      rowIndex,
      errors,
      warnings,
      valid: errors.length === 0,
      // Attach tên lớp để preview
      _tenlop: lopMap[row.malop?.trim()] ?? null,
    } as ImportRowResult & { _tenlop?: string };
  });

  const summary = {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
  };

  // ── Nếu chỉ validate, trả về kết quả ngay ────────────────────────────────
  if (validateOnly) {
    return NextResponse.json({ results, summary });
  }

  // ── Phase 2: Ghi DB ───────────────────────────────────────────────────────
  const validRows = results.filter(r => r.valid);
  if (validRows.length === 0) {
    return NextResponse.json({ error: "Không có dòng hợp lệ để nhập." }, { status: 400 });
  }

  let successCount = 0;
  const failedRows: { rowIndex: number; masv: string; error: string }[] = [];

  for (const row of validRows) {
    try {
      // Hash mật khẩu
      const { data: hashed, error: hashErr } = await supabase
        .rpc("hash_password", { password: row.matkhau });

      if (hashErr || !hashed) throw new Error("Lỗi hash mật khẩu.");

      // Tạo tài khoản
      const { data: tk, error: tkErr } = await supabase
        .from("taikhoan")
        .insert({
          mataikhoan: row.masv,
          email: row.email,
          matkhau: hashed,
          vaitro: "SinhVien",
          trangthai: "HoatDong",
        })
        .select("mataikhoan")
        .single();

      if (tkErr) throw new Error(tkErr.message);

      // Tạo sinh viên
      const { error: svErr } = await supabase
        .from("sinhvien")
        .insert({
          masv: row.masv,
          malop: row.malop,
          hoten: row.hoten,
          ngaysinh: row.ngaysinh || null,
          gioitinh: ["Nam", "Nu", "Khac"].includes(row.gioitinh ?? "") ? row.gioitinh : null,
          emailtruong: row.emailtruong?.trim() || null,
          trangthai: "Danghoc",
          mataikhoan: tk.mataikhoan,
        });

      if (svErr) {
        // Rollback tài khoản vừa tạo
        await supabase.from("taikhoan").delete().eq("mataikhoan", row.masv);
        throw new Error(svErr.message);
      }

      successCount++;
    } catch (e) {
      failedRows.push({
        rowIndex: row.rowIndex,
        masv: row.masv,
        error: e instanceof Error ? e.message : "Lỗi không xác định.",
      });
    }
  }

  if (successCount > 0) {
    await logAuditAction({
      supabase,
      mataikhoan: adminPayload.mataikhoan,
      hanhdong: "BULK_IMPORT_STUDENT",
      tentable: "sinhvien",
      makhoachinh: `successCount:${successCount}`,
      giatrimoi: { successCount, failed: failedRows.length },
      request,
    });
  }

  return NextResponse.json({
    success: true,
    summary: {
      total: validRows.length,
      success: successCount,
      failed: failedRows.length,
    },
    failedRows,
  });
}