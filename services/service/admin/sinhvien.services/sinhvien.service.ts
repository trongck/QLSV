import { SupabaseClient } from "@supabase/supabase-js";
import * as repo from "@/services/repositories/admin/sinhvien.repo";

export function mapSinhVien(sv: any) {
  if (!sv) return sv;
  return {
    ...sv,
    hoten: [sv.hodem, sv.ten].filter(Boolean).join(" ") || "Chưa thiết lập",
  };
}

export async function getSinhVienListService(
  supabase: SupabaseClient,
  params: { search?: string; malop?: string; makhoa?: string; trangthai?: string; page: number; limit: number }
) {
  const from = (params.page - 1) * params.limit;
  const to = from + params.limit - 1;

  const { data, count, error } = await repo.getSinhVienListRepo(supabase, {
    search: params.search,
    malop: params.malop,
    trangthai: params.trangthai,
    from,
    to,
  });

  if (error) throw new Error(error.message);

  const filtered = params.makhoa
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (data ?? []).filter((sv: any) => sv.lop?.makhoa === params.makhoa)
    : (data ?? []);

  return {
    data: filtered.map(mapSinhVien),
    total: count ?? 0,
  };
}

export async function createSinhVienService(supabase: SupabaseClient, body: any) {
  const { masv, malop, hoten, hodem, ten, ngaysinh, gioitinh, emailtruong, email, matkhau, chiTiet } = body;

  // 1. Hash password
  const { data: hashed, error: hashErr } = await repo.hashPasswordRepo(supabase, matkhau);
  if (hashErr || !hashed) throw new Error("Lỗi hash mật khẩu.");

  // 2. Insert account
  const { data: tk, error: tkErr } = await repo.createTaiKhoanRepo(supabase, {
    mataikhoan: masv.trim(),
    email: email.trim(),
    matkhau: hashed,
    vaitro: "SinhVien",
    trangthai: "HoatDong",
  });
  if (tkErr) throw new Error("Không thể tạo tài khoản: " + tkErr.message);

  // Legacy fallback
  let parsedHodem = hodem ? hodem.trim() : "";
  let parsedTen = ten ? ten.trim() : "";
  if (!parsedHodem && !parsedTen && hoten) {
    const parts = hoten.trim().split(" ");
    if (parts.length > 1) {
      parsedTen = parts.pop() || "";
      parsedHodem = parts.join(" ");
    } else {
      parsedTen = parts[0] || "";
      parsedHodem = "";
    }
  }

  // 3. Create sinhvien with merged chiTiet fields
  const { data: sv, error: svErr } = await repo.createSinhVienRepo(supabase, {
    masv: masv.trim(),
    malop: malop.trim(),
    hodem: parsedHodem || null,
    ten: parsedTen || null,
    ngaysinh: ngaysinh || null,
    gioitinh: gioitinh || null,
    emailtruong: emailtruong || null,
    trangthai: "Danghoc",
    mataikhoan: tk.mataikhoan,
    // Merge chitietsinhvien fields directly
    ...(chiTiet ?? {}),
  });

  if (svErr) {
    await repo.deleteTaiKhoanRepo(supabase, tk.mataikhoan);
    throw new Error(svErr.message);
  }

  return mapSinhVien(sv);
}

export async function getSinhVienByIdService(supabase: SupabaseClient, masv: string) {
  const { data, error } = await repo.getSinhVienByIdRepo(supabase, masv);
  if (error) throw new Error(error.message);
  return mapSinhVien(data);
}

export async function updateSinhVienService(supabase: SupabaseClient, masv: string, body: any) {
  const { hoten, hodem, ten, ngaysinh, gioitinh, malop, trangthai, emailtruong, chiTiet } = body;

  const update: Record<string, unknown> = {};

  if (hodem !== undefined) update.hodem = hodem ? hodem.trim() : null;
  if (ten !== undefined) update.ten = ten ? ten.trim() : null;

  // Legacy fallback
  if (hoten && update.hodem === undefined && update.ten === undefined) {
    const parts = hoten.trim().split(" ");
    if (parts.length > 1) {
      update.ten = parts.pop() || "";
      update.hodem = parts.join(" ");
    } else {
      update.ten = parts[0] || "";
      update.hodem = "";
    }
  }

  if (ngaysinh !== undefined) update.ngaysinh = ngaysinh || null;
  if (gioitinh !== undefined) update.gioitinh = gioitinh || null;
  if (malop) update.malop = malop;
  if (trangthai !== undefined) update.trangthai = trangthai;
  if (emailtruong !== undefined) update.emailtruong = emailtruong || null;

  if (chiTiet && Object.keys(chiTiet).length > 0) {
    Object.assign(update, chiTiet);
  }

  const { data, error } = await repo.updateSinhVienRepo(supabase, masv, update);
  if (error) throw new Error(error.message);

  return mapSinhVien(data);
}

export async function deleteSinhVienService(supabase: SupabaseClient, masv: string) {
  // Get mataikhoan first
  const { data: sv } = await repo.getSinhVienMaTaiKhoanRepo(supabase, masv);

  const { error } = await repo.deleteSinhVienRepo(supabase, masv);
  if (error) throw new Error(error.message);

  if (sv?.mataikhoan) {
    await repo.deleteTaiKhoanRepo(supabase, sv.mataikhoan);
  }
}

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

export async function bulkImportSinhVienService(
  supabase: SupabaseClient,
  rows: ImportRow[],
  validateOnly: boolean = true
) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Không có dữ liệu để xử lý.");
  }

  if (rows.length > 1000) {
    throw new Error("Tối đa 1000 sinh viên mỗi lần import.");
  }

  // 1. Prefetch dữ liệu qua Repo
  const masvs = rows.map(r => r.masv).filter(Boolean);
  const emails = rows.map(r => r.email).filter(Boolean);

  const [
    { data: existingSV, error: svErr },
    { data: existingTK, error: tkErr },
    { data: allLops, error: lopErr }
  ] = await repo.validateImportPrefetchRepo(supabase, masvs, emails);

  if (svErr) throw new Error(svErr.message);
  if (tkErr) throw new Error(tkErr.message);
  if (lopErr) throw new Error(lopErr.message);

  const existingMaSV = new Set((existingSV ?? []).map(r => r.masv));
  const existingEmails = new Set((existingTK ?? []).map(r => r.email));
  const validLops = new Set((allLops ?? []).map(r => r.malop));
  const lopMap = Object.fromEntries((allLops ?? []).map(r => [r.malop, r.tenlop]));

  // Track duplicates trong batch
  const seenMaSV = new Map<string, number>();
  const seenEmail = new Map<string, number>();

  // ── Validate từng row ─────────────────────────────────────────────────────
  const results = rows.map((row, idx) => {
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
      _tenlop: lopMap[row.malop?.trim()] ?? null,
    } as ImportRowResult & { _tenlop?: string | null };
  });

  const summary = {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
  };

  // Nếu chỉ validate, trả về kết quả luôn
  if (validateOnly) {
    return { results, summary };
  }

  // ── Phase 2: Ghi DB ───────────────────────────────────────────────────────
  const validRows = results.filter(r => r.valid);
  if (validRows.length === 0) {
    throw new Error("Không có dòng hợp lệ để nhập.");
  }

  let successCount = 0;
  const failedRows: { rowIndex: number; masv: string; error: string }[] = [];

  for (const row of validRows) {
    try {
      // Hash mật khẩu
      const { data: hashed, error: hashErr } = await repo.hashPasswordRepo(supabase, row.matkhau);
      if (hashErr || !hashed) throw new Error("Lỗi hash mật khẩu.");

      // Tạo tài khoản
      const { data: tk, error: tkErr } = await repo.createTaiKhoanRepo(supabase, {
        mataikhoan: row.masv,
        email: row.email,
        matkhau: hashed,
        vaitro: "SinhVien",
        trangthai: "HoatDong",
      });

      if (tkErr) throw new Error(tkErr.message);

      // Legacy fallback: split row.hoten if hodem/ten not defined on row
      let parsedHodem = (row as any).hodem ? (row as any).hodem.trim() : "";
      let parsedTen = (row as any).ten ? (row as any).ten.trim() : "";
      if (!parsedHodem && !parsedTen && row.hoten) {
        const parts = row.hoten.trim().split(" ");
        if (parts.length > 1) {
          parsedTen = parts.pop() || "";
          parsedHodem = parts.join(" ");
        } else {
          parsedTen = parts[0] || "";
          parsedHodem = "";
        }
      }

      // Tạo sinh viên
      const { error: svErr } = await repo.createSinhVienRepo(supabase, {
        masv: row.masv,
        malop: row.malop,
        hodem: parsedHodem || null,
        ten: parsedTen || null,
        ngaysinh: row.ngaysinh || null,
        gioitinh: ["Nam", "Nu", "Khac"].includes(row.gioitinh ?? "") ? row.gioitinh : null,
        emailtruong: row.emailtruong?.trim() || null,
        trangthai: "Danghoc",
        mataikhoan: tk.mataikhoan,
      });

      if (svErr) {
        // Rollback tài khoản vừa tạo
        await repo.deleteTaiKhoanRepo(supabase, row.masv);
        throw new Error(svErr.message);
      }

      successCount++;
    } catch (e: any) {
      failedRows.push({
        rowIndex: row.rowIndex,
        masv: row.masv,
        error: e?.message || "Lỗi không xác định.",
      });
    }
  }

  return {
    success: true,
    summary: {
      total: validRows.length,
      success: successCount,
      failed: failedRows.length,
    },
    failedRows,
  };
}
