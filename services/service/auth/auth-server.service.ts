import { SupabaseClient } from "@supabase/supabase-js";
import { VaiTro } from "@/types";
import type { UserProfile } from "@/models";
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
  refreshTokenExpiresAt,
  extractBearer,
} from "@/lib/utils/jwt";
import * as repo from "../../repositories/auth/auth.repo";
import fs from "fs";
import path from "path";

// ─── Logging & Format Helpers ──────────────────────────────────────────────────

function writeResetLog(id: string, type: string, email: string, name: string) {
  try {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logPath = path.join(logDir, "password_resets.log");
    const timestamp = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    const logMessage = `[${timestamp}] CẤP LẠI MẬT KHẨU THÀNH CÔNG: Loại=${type}, Mã số=${id}, Họ tên=${name}, Email=${email}\n`;
    fs.appendFileSync(logPath, logMessage, "utf8");
    console.log(logMessage.trim());
  } catch (err) {
    console.error("Lỗi khi ghi file nhật ký reset password:", err);
  }
}

function formatBirthdateToPassword(ngaysinhRaw: string | Date | null): string {
  if (!ngaysinhRaw) return "123456";

  const dateStr =
    typeof ngaysinhRaw === "string"
      ? ngaysinhRaw
      : new Date(ngaysinhRaw).toISOString().split("T")[0];

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const yyyy = parts[0];
    const mm = parts[1];
    const dd = parts[2];
    const yy = yyyy.slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  const birthDate = new Date(ngaysinhRaw);
  const dd = String(birthDate.getDate()).padStart(2, "0");
  const mm = String(birthDate.getMonth() + 1).padStart(2, "0");
  const yy = String(birthDate.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export async function fetchProfileHelper(supabase: SupabaseClient, mataikhoan: string, email: string, vaitro: string): Promise<UserProfile> {
  let hoten = "";
  let anhdaidien: string | null = null;
  let maSinhVien: string | undefined;
  let maGiangVien: string | undefined;
  let maAdmin: string | undefined;

  if (vaitro === VaiTro.SinhVien) {
    const { data: sv } = await repo.fetchProfileSinhVienRepo(supabase, mataikhoan);
    hoten = sv?.hoten ?? "Sinh Viên";
    anhdaidien = sv?.anhdaidien ?? null;
    maSinhVien = sv?.masv;
  } else if (vaitro === VaiTro.GiangVien) {
    const { data: gv } = await repo.fetchProfileGiangVienRepo(supabase, mataikhoan);
    hoten = gv?.hoten ?? "Giảng Viên";
    anhdaidien = gv?.anhdaidien ?? null;
    maGiangVien = gv?.magv;
  } else if (vaitro === VaiTro.Admin) {
    const { data: admin } = await repo.fetchProfileAdminRepo(supabase, mataikhoan);
    hoten = admin?.hoten ?? "Admin";
    maAdmin = admin?.maadmin;
  }

  return {
    mataikhoan,
    email,
    vaitro: vaitro as VaiTro,
    hoten,
    anhdaidien,
    maSinhVien,
    maGiangVien,
    maAdmin,
  };
}

// ─── Service Core Functions ─────────────────────────────────────────────────────

export async function loginService(supabase: SupabaseClient, email: string, matkhau: string, diachiip: string | null) {
  const { data: taikhoan, error: tkError } = await repo.getAccountByEmailOrIdRepo(supabase, email);

  if (tkError || !taikhoan) {
    throw new Error("Không tìm thấy tài khoản hoặc sai mã/email.");
  }

  if (taikhoan.trangthai === "Khoa") {
    throw new Error("Tài khoản của bạn đã bị khóa.");
  }

  const { data: isMatch, error: verifyError } = await supabase.rpc("verify_password", {
    input_password: matkhau,
    hashed_password: taikhoan.matkhau,
  });

  if (verifyError) {
    console.error("[login] verify_password RPC error:", verifyError.message);
    throw new Error("Lỗi xác thực mật khẩu. Vui lòng thử lại.");
  }

  if (!isMatch) {
    throw new Error("Sai mật khẩu. Vui lòng thử lại.");
  }

  const userProfile = await fetchProfileHelper(supabase, taikhoan.mataikhoan, taikhoan.email, taikhoan.vaitro);

  const jwtPayload = {
    mataikhoan: taikhoan.mataikhoan,
    email: taikhoan.email,
    vaitro: taikhoan.vaitro as VaiTro,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(jwtPayload),
    signRefreshToken(jwtPayload),
  ]);

  await repo.insertSessionRepo(supabase, {
    mataikhoan: taikhoan.mataikhoan,
    refreshtoken: refreshToken,
    diachiip,
    thoigianhethan: refreshTokenExpiresAt().toISOString(),
  });

  await repo.updateLastLoginRepo(supabase, taikhoan.mataikhoan);

  return { accessToken, refreshToken, user: userProfile };
}

export async function logoutService(supabase: SupabaseClient, refreshToken: string) {
  if (refreshToken) {
    await repo.deleteSessionRepo(supabase, refreshToken);
  }
}

export async function logoutAllService(supabase: SupabaseClient, mataikhoan: string) {
  if (!mataikhoan) {
    throw new Error("Thiếu mataikhoan.");
  }
  await repo.deleteAllSessionsRepo(supabase, mataikhoan);
}

export async function getCurrentUserService(supabase: SupabaseClient, authorizationHeader: string | null) {
  const token = extractBearer(authorizationHeader);
  if (!token) {
    throw new Error("Unauthorized");
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new Error("Token không hợp lệ hoặc đã hết hạn.");
  }

  const { data: taikhoan } = await repo.getAccountByIdRepo(supabase, payload.mataikhoan);

  if (!taikhoan || taikhoan.trangthai === "Khoa") {
    throw new Error("Tài khoản không hợp lệ hoặc đã bị khóa.");
  }

  const userProfile = await fetchProfileHelper(supabase, taikhoan.mataikhoan, taikhoan.email, taikhoan.vaitro);

  return userProfile;
}

export async function refreshTokenService(supabase: SupabaseClient, refreshToken: string, diachiip: string | null) {
  if (!refreshToken) {
    throw new Error("Thiếu refresh token.");
  }

  let payload;
  try {
    payload = await verifyToken(refreshToken);
  } catch {
    throw new Error("Refresh token không hợp lệ hoặc đã hết hạn.");
  }

  const { data: phien } = await repo.getSessionRepo(supabase, refreshToken);

  if (!phien) {
    throw new Error("Phiên đăng nhập không tồn tại hoặc đã bị thu hồi.");
  }

  if (new Date(phien.thoigianhethan) < new Date()) {
    await repo.deleteSessionByIdRepo(supabase, phien.maphien);
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const { data: taikhoan } = await repo.getAccountByIdRepo(supabase, payload.mataikhoan);

  if (!taikhoan || taikhoan.trangthai === "Khoa") {
    throw new Error("Tài khoản không hợp lệ hoặc đã bị khóa.");
  }

  const jwtPayload = {
    mataikhoan: taikhoan.mataikhoan,
    email: taikhoan.email,
    vaitro: taikhoan.vaitro,
  };

  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken(jwtPayload),
    signRefreshToken(jwtPayload),
  ]);

  await repo.updateSessionRepo(supabase, phien.maphien, {
    refreshtoken: newRefreshToken,
    diachiip,
    thoigianhethan: refreshTokenExpiresAt().toISOString(),
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function resetPasswordRequestService(supabase: SupabaseClient, body: any, diachiip: string) {
  const { type, id, sdt, email, lydo } = body || {};

  if (!type || !id?.trim() || !sdt?.trim() || !email?.trim() || !lydo?.trim()) {
    throw new Error("Vui lòng nhập đầy đủ tất cả thông tin yêu cầu.");
  }

  let mataikhoan = "";
  let ngaysinhRaw: string | Date | null = null;
  let hoten = "";

  if (type === "sinhvien") {
    const { data: sv, error: svError } = await repo.getSinhVienContactRepo(supabase, id.trim());
    if (svError || !sv) {
      throw new Error("Mã sinh viên không tồn tại trong hệ thống.");
    }
    mataikhoan = sv.mataikhoan;
    ngaysinhRaw = sv.ngaysinh;
    hoten = sv.hoten;

    const { data: ct, error: ctError } = await repo.getSinhVienDetailContactRepo(supabase, id.trim());
    if (ctError || !ct) {
      throw new Error("Không tìm thấy thông tin liên hệ chi tiết của sinh viên này.");
    }

    if (
      ct.sodienthoai?.trim() !== sdt.trim() ||
      ct.emailcanhan?.trim().toLowerCase() !== email.trim().toLowerCase()
    ) {
      throw new Error("Email hoặc số điện thoại không tồn tại hoặc không đúng với thông tin đã đăng ký.");
    }

  } else if (type === "giangvien") {
    const { data: gv, error: gvError } = await repo.getGiangVienContactRepo(supabase, id.trim());
    if (gvError || !gv) {
      throw new Error("Mã giảng viên không tồn tại trong hệ thống.");
    }
    mataikhoan = gv.mataikhoan;
    ngaysinhRaw = gv.ngaysinh;
    hoten = gv.hoten;

    const { data: ct, error: ctError } = await repo.getGiangVienDetailContactRepo(supabase, id.trim());
    if (ctError || !ct) {
      throw new Error("Không tìm thấy thông tin liên hệ chi tiết của giảng viên này.");
    }

    if (
      ct.sodienthoai?.trim() !== sdt.trim() ||
      ct.emailcanhan?.trim().toLowerCase() !== email.trim().toLowerCase()
    ) {
      throw new Error("Email hoặc số điện thoại không tồn tại hoặc không đúng với thông tin đã đăng ký.");
    }
  } else {
    throw new Error("Loại tài khoản không hợp lệ.");
  }

  if (!mataikhoan) {
    throw new Error("Không xác định được tài khoản người dùng.");
  }

  const newPassword = formatBirthdateToPassword(ngaysinhRaw);

  const { data: hashed, error: hashErr } = await supabase.rpc("hash_password", {
    password: newPassword
  });

  if (hashErr || !hashed) {
    console.error("[reset-password-auto] RPC Hash Error:", hashErr?.message);
    throw new Error("Lỗi mã hóa mật khẩu trên hệ thống.");
  }

  const { error: tkUpdateErr } = await repo.updateAccountPasswordRepo(supabase, mataikhoan, hashed);
  if (tkUpdateErr) {
    console.error("[reset-password-auto] Update password error:", tkUpdateErr.message);
    throw new Error("Lỗi cập nhật cơ sở dữ liệu mật khẩu.");
  }

  writeResetLog(id.trim(), type, email.trim().toLowerCase(), hoten);

  await repo.logSystemActionRepo(supabase, {
    mataikhoan: id.trim(),
    hanhdong: "Yêu cầu thay đổi mật khẩu",
    tentable: "taikhoan",
    makhoachinh: id.trim(),
    giatricu: null,
    giatrimoi: null,
    diachiip
  });

  // Call EmailJS
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim() || process.env.EMAILJS_ACCESS_TOKEN?.trim();

  let emailSent = false;
  if (serviceId && templateId && publicKey) {
    try {
      const payload: Record<string, any> = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          email: email.trim().toLowerCase(),
          status: "Mật khẩu mới của bạn là:",
          password: newPassword
        }
      };

      if (privateKey) {
        payload.accessToken = privateKey;
      }

      const emailjsRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!emailjsRes.ok) {
        const errText = await emailjsRes.text();
        console.error("[reset-password-auto] EmailJS error response:", errText);
      } else {
        console.log("[reset-password-auto] EmailJS sent successfully on server to:", email);
        emailSent = true;
      }
    } catch (emailErr) {
      console.error("[reset-password-auto] Failed to send EmailJS from server:", emailErr);
    }
  }

  return {
    success: true,
    emailSent,
    newPassword,
    hoten,
    email: email.trim().toLowerCase()
  };
}

export async function getResetPasswordLogsService(supabase: SupabaseClient) {
  const { data, error } = await repo.getResetPasswordLogsRepo(supabase);
  if (error) throw new Error(error.message);
  return data;
}
