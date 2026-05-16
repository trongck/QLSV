import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/utils/supabase/server";
import fs from "fs";
import path from "path";

// ─── Ghi nhật ký (Log) hoạt động ──────────────────────────────────────────────
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

// ─── Định dạng ngày sinh thành mật khẩu dd/mm/yy ──────────────────────────────
function formatBirthdateToPassword(ngaysinhRaw: string | Date | null): string {
  if (!ngaysinhRaw) return "12/05/01"; // Fallback mặc định nếu không có ngày sinh

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

  // Fallback 2
  const birthDate = new Date(ngaysinhRaw);
  const dd = String(birthDate.getDate()).padStart(2, "0");
  const mm = String(birthDate.getMonth() + 1).padStart(2, "0");
  const yy = String(birthDate.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { type, id, sdt, email, lydo } = body || {};

    if (!type || !id?.trim() || !sdt?.trim() || !email?.trim() || !lydo?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ tất cả thông tin yêu cầu." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    let mataikhoan = "";
    let ngaysinhRaw: string | Date | null = null;
    let hoten = "";

    if (type === "sinhvien") {
      // 1. Tìm sinh viên
      const { data: sv, error: svError } = await supabase
        .from("sinhvien")
        .select("masv, mataikhoan, ngaysinh, hoten")
        .eq("masv", id.trim())
        .single();

      if (svError || !sv) {
        return NextResponse.json(
          { error: "Mã sinh viên không tồn tại trong hệ thống." },
          { status: 404 }
        );
      }
      mataikhoan = sv.mataikhoan;
      ngaysinhRaw = sv.ngaysinh;
      hoten = sv.hoten;

      // 2. Tìm thông tin chi tiết của sinh viên
      const { data: ct, error: ctError } = await supabase
        .from("chitietsinhvien")
        .select("sodienthoai, emailcanhan")
        .eq("masv", id.trim())
        .single();

      if (ctError || !ct) {
        return NextResponse.json(
          { error: "Không tìm thấy thông tin liên hệ chi tiết của sinh viên này." },
          { status: 404 }
        );
      }

      // 3. Kiểm tra sdt và email cá nhân
      if (
        ct.sodienthoai?.trim() !== sdt.trim() ||
        ct.emailcanhan?.trim().toLowerCase() !== email.trim().toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Email hoặc số điện thoại không tồn tại hoặc không đúng với thông tin đã đăng ký." },
          { status: 400 }
        );
      }

    } else if (type === "giangvien") {
      // 1. Tìm giảng viên
      const { data: gv, error: gvError } = await supabase
        .from("giangvien")
        .select("magv, mataikhoan, ngaysinh, hoten")
        .eq("magv", id.trim())
        .single();

      if (gvError || !gv) {
        return NextResponse.json(
          { error: "Mã giảng viên không tồn tại trong hệ thống." },
          { status: 404 }
        );
      }
      mataikhoan = gv.mataikhoan;
      ngaysinhRaw = gv.ngaysinh;
      hoten = gv.hoten;

      // 2. Tìm thông tin chi tiết giảng viên
      const { data: ct, error: ctError } = await supabase
        .from("chitietgiangvien")
        .select("sodienthoai, emailcanhan")
        .eq("magv", id.trim())
        .single();

      if (ctError || !ct) {
        return NextResponse.json(
          { error: "Không tìm thấy thông tin liên hệ chi tiết của giảng viên này." },
          { status: 404 }
        );
      }

      // 3. Kiểm tra sdt và email cá nhân
      if (
        ct.sodienthoai?.trim() !== sdt.trim() ||
        ct.emailcanhan?.trim().toLowerCase() !== email.trim().toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Email hoặc số điện thoại không tồn tại hoặc không đúng với thông tin đã đăng ký." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Loại tài khoản không hợp lệ." },
        { status: 400 }
      );
    }

    if (!mataikhoan) {
      return NextResponse.json(
        { error: "Không xác định được tài khoản người dùng." },
        { status: 400 }
      );
    }

    // 4. Tạo mật khẩu mới dạng dd/mm/yy
    const newPassword = formatBirthdateToPassword(ngaysinhRaw);

    // 5. Mã hóa mật khẩu thông qua RPC hash_password
    const { data: hashed, error: hashErr } = await supabase.rpc("hash_password", {
      password: newPassword
    });

    if (hashErr || !hashed) {
      console.error("[reset-password-auto] RPC Hash Error:", hashErr?.message);
      return NextResponse.json(
        { error: "Lỗi mã hóa mật khẩu trên hệ thống." },
        { status: 500 }
      );
    }

    // 6. Cập nhật mật khẩu mới vào cơ sở dữ liệu
    const { error: tkUpdateErr } = await supabase
      .from("taikhoan")
      .update({ matkhau: hashed })
      .eq("mataikhoan", mataikhoan);

    if (tkUpdateErr) {
      console.error("[reset-password-auto] Update password error:", tkUpdateErr.message);
      return NextResponse.json(
        { error: "Lỗi cập nhật cơ sở dữ liệu mật khẩu." },
        { status: 500 }
      );
    }

    // 7. Ghi lại nhật ký log thành công
    writeResetLog(id.trim(), type, email.trim().toLowerCase(), hoten);

    // Ghi nhật ký vào database nhatkyhethong theo đúng cấu trúc yêu cầu
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    await supabase.from("nhatkyhethong").insert({
      mataikhoan: id.trim(), // mã sinh viên, giảng viên
      hanhdong: "Yêu cầu thay đổi mật khẩu",
      tentable: "taikhoan",
      makhoachinh: id.trim(), // (magv,sv)
      giatricu: null,
      giatrimoi: null,
      diachiip: ip
    });

    // 8. Gửi email trực tiếp từ Server-side bằng EmailJS
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
    } else {
      console.warn("[reset-password-auto] EmailJS env variables are missing on server.");
    }

    // 9. Trả về thông tin thành công
    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Cấp lại mật khẩu mới thành công! Mật khẩu mới của bạn đã được gửi tới email cá nhân đăng ký."
        : "Cấp lại mật khẩu mới thành công và đã cập nhật vào hệ thống! Tuy nhiên, hệ thống không thể gửi email tự động (vui lòng liên hệ Admin để kiểm tra cấu hình EmailJS). Mật khẩu mới là ngày sinh dạng dd/mm/yy của bạn.",
      email: email.trim().toLowerCase(),
      password: newPassword,
      status: "Mật khẩu mới của bạn là:"
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi hệ thống nội bộ.";
    console.error("[reset-password-auto] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
