"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import Image from "next/image";

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, submitting, error, setError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [mounted, setMounted] = useState(false);

  // Password reset request states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<"sinhvien" | "giangvien">(
    "sinhvien",
  );
  const [resetId, setResetId] = useState("");
  const [resetSdt, setResetSdt] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLydo, setResetLydo] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    emailRef.current?.focus();
  }, []);

  const handleEmailChange = (v: string) => {
    setEmail(v);
    setFieldErrors((e) => ({ ...e, email: undefined }));
    setError(null);
  };
  const handlePasswordChange = (v: string) => {
    setPassword(v);
    setFieldErrors((e) => ({ ...e, password: undefined }));
    setError(null);
  };

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = "Vui lòng nhập mã tài khoản hoặc email.";
    if (!password.trim()) errs.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await login({ email: email.trim(), matkhau: password }, remember);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#FFF2EB] max-lg:flex-col max-lg:items-center">
      <div className="absolute -top-20 -left-30 w-[420px] h-[420px] bg-[#FFDCDC] rounded-full opacity-60 pointer-events-none z-0 max-sm:opacity-40 max-sm:w-[260px] max-sm:h-[260px] max-sm:-top-15 max-sm:-left-20" aria-hidden />
      <div className="absolute -bottom-[100px] right-[30%] w-[260px] h-[260px] bg-[#FFE8CD] rounded-full opacity-70 pointer-events-none z-0 max-lg:right-[5%] max-sm:opacity-40 max-sm:w-[180px] max-sm:h-[180px] max-sm:-right-10 max-sm:-bottom-15" aria-hidden />

      {/* LEFT PANEL */}
      <aside className={`flex-1 flex flex-col justify-between p-12 relative z-10 transition-all duration-[450ms] ease-out max-lg:w-full max-lg:flex-none max-lg:p-[28px_24px_0] max-lg:flex-col max-lg:items-start max-lg:translate-x-0 max-lg:opacity-100 max-sm:hidden ${mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"}`}>
        <div className="flex items-center gap-2.5 no-underline w-fit">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 3L20 8V16L12 21L4 16V8L12 3Z"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[17px] font-bold text-[#2D1B14] tracking-tight">Hệ Thống quản lý sinh viên</span>
        </div>

        <div className="flex justify-center items-center w-full max-w-[600px] m-auto animate-fadeInUp bg-transparent max-lg:mt-4 max-lg:max-w-[400px]">
          <Image
            src="/intro.png"
            alt="Giới thiệu hệ thống"
            width={600}
            height={500}
            className="w-full h-auto block object-contain rounded-[24px] shadow-[0_12px_32px_rgba(76,38,24,0.08)]"
            priority
          />
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className={`flex-1 flex flex-col items-center justify-center p-[48px_56px] relative z-10 transition-all duration-[450ms] delay-100 ease-out max-lg:flex-none max-lg:w-full max-lg:max-w-[480px] max-lg:p-[24px_24px_48px] max-lg:translate-x-0 max-lg:opacity-100 max-lg:self-center max-sm:p-[32px_20px_48px] max-sm:justify-start max-sm:min-h-screen ${mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"}`}>
        <div className="hidden items-center gap-2 mb-6 max-sm:flex" aria-label="Lumen University">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 3L20 8V16L12 21L4 16V8L12 3Z"
                fill="white"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[17px] font-bold text-[#2D1B14] tracking-tight" style={{ fontSize: "15px" }}>
            Hệ thống quản lý sinh viên
          </span>
        </div>

        <div className="w-full max-w-[420px] max-sm:max-w-full">
          <p className="text-[13px] font-semibold text-primary uppercase tracking-[0.08em] m-0 mb-3 max-sm:text-[11px]">Hệ thống quản lý sinh viên - VNUA</p>
          <h1 className="text-[38px] font-bold text-[#2D1B14] leading-tight tracking-tight m-0 mb-3 max-lg:text-[32px] max-sm:text-[28px]">
            Xin chào,
            <br />
            đăng nhập nào.
          </h1>
          <p className="text-sm text-[#6B4F3F] m-0 mb-6 leading-relaxed">
            Nhập thông tin của bạn để tiếp tục vào hệ thống.
          </p>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl p-[10px_14px] text-[13px] font-medium text-primary mb-4 animate-slideDown"
              role="alert"
              aria-live="assertive"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#C25450"
                  strokeWidth="2"
                />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="#C25450"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide" htmlFor="field-email">
                Mã tài khoản / Email
              </label>
              <input
                id="field-email"
                ref={emailRef}
                type="text"
                autoComplete="username"
                placeholder="Nhập mã tài khoản hoặc email..."
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`input ${fieldErrors.email ? "error" : ""}`}
                aria-describedby={fieldErrors.email ? "err-email" : undefined}
                aria-invalid={!!fieldErrors.email}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <span id="err-email" className="text-xs text-primary font-medium" role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide" htmlFor="field-password">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <input
                  id="field-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`input ${fieldErrors.password ? "error" : ""} pr-11`}
                  aria-describedby={fieldErrors.password ? "err-pw" : undefined}
                  aria-invalid={!!fieldErrors.password}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-1 flex items-center justify-center text-[#8B6F5F]"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                        stroke="#8B6F5F"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                        stroke="#8B6F5F"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"
                        stroke="#8B6F5F"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="#8B6F5F"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span id="err-pw" className="text-xs text-primary font-medium" role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer shrink-0"
                disabled={submitting}
              />
              <span className="text-[13px] text-[#6B4F3F]">Duy trì đăng nhập</span>
            </label>

            <button
              type="submit"
              id="btn-login"
              className="btn-primary"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span
                    className="animate-spin inline-block w-4 h-4 border-2 border-white/35 border-t-white rounded-full"
                    aria-hidden
                  />
                  Đang đăng nhập…
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className="mt-5 text-[13px] text-[#8B6F5F] text-center">
            Bạn quên mật khẩu?{" "}
            <a
              href="#"
              className="text-primary font-semibold no-underline hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setShowResetModal(true);
                setResetSuccess(null);
                setResetError(null);
                setResetId("");
                setResetSdt("");
                setResetEmail("");
                setResetLydo("");
              }}
            >
              Gửi yêu cầu cấp lại mật khẩu!
            </a>
          </p>
        </div>
      </main>

      {showResetModal && (
        <div className="fixed inset-0 bg-[#2D1B14]/45 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-fadeIn">
          <div className="bg-white rounded-[20px] w-full max-w-[460px] shadow-[0_20px_48px_rgba(76,38,24,0.15)] border border-primary/10 overflow-hidden animate-scaleUp flex flex-col">
            <div className="flex items-center justify-between p-[20px_24px] border-b border-[#FFE8CD] bg-[#FFF2EB]">
              <h2 className="text-lg font-bold text-[#2D1B14]">Yêu cầu cấp lại mật khẩu</h2>
              <button
                type="button"
                className="bg-transparent border-none cursor-pointer text-[#8B6F5F] flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                onClick={() => setShowResetModal(false)}
                aria-label="Đóng"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {resetSuccess ? (
              <div className="text-center p-[40px_24px] flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#2D1B14]">Gửi yêu cầu thành công</h3>
                <p className="text-sm text-[#6B4F3F] leading-relaxed">{resetSuccess}</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowResetModal(false)}
                  style={{ marginTop: 8 }}
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    !resetId.trim() ||
                    !resetSdt.trim() ||
                    !resetEmail.trim() ||
                    !resetLydo.trim()
                  ) {
                    setResetError("Vui lòng điền đầy đủ các thông tin.");
                    return;
                  }
                  setResetSubmitting(true);
                  setResetError(null);
                  try {
                    const res = await fetch(
                      "/api/auth/reset-password-request",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          type: resetType,
                          id: resetId.trim(),
                          sdt: resetSdt.trim(),
                          email: resetEmail.trim(),
                          lydo: resetLydo.trim(),
                        }),
                      },
                    );
                    const data = await res.json();
                    if (!res.ok) {
                      setResetError(data.error || "Gửi yêu cầu thất bại.");
                    } else {
                      setResetSuccess(data.message);
                    }
                  } catch (err) {
                    setResetError("Lỗi kết nối mạng. Vui lòng thử lại.");
                  } finally {
                    setResetSubmitting(false);
                  }
                }}
              >
                <div className="p-6 flex flex-col gap-4">
                  {resetError && (
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl p-[10px_14px] text-[13px] font-medium text-primary mb-4 animate-slideDown">{resetError}</div>
                  )}

                  {/* Account Type Tabs */}
                  <div className="flex bg-[#FFF2EB] rounded-xl p-[3px] gap-0.5">
                    <button
                      type="button"
                      className={`flex-1 h-9 border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 ${resetType === "sinhvien" ? "bg-primary text-white font-semibold" : "bg-transparent text-[#6B4F3F]"}`}
                      onClick={() => {
                        setResetType("sinhvien");
                        setResetError(null);
                      }}
                    >
                      Sinh viên
                    </button>
                    <button
                      type="button"
                      className={`flex-1 h-9 border-none rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 ${resetType === "giangvien" ? "bg-primary text-white font-semibold" : "bg-transparent text-[#6B4F3F]"}`}
                      onClick={() => {
                        setResetType("giangvien");
                        setResetError(null);
                      }}
                    >
                      Giảng viên
                    </button>
                  </div>

                  {/* ID Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide">
                      {resetType === "sinhvien"
                        ? "Mã sinh viên"
                        : "Mã giảng viên"}
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder={
                        resetType === "sinhvien"
                          ? "Nhập mã sinh viên (ví dụ: SV0001)..."
                          : "Nhập mã giảng viên (ví dụ: GV0001)..."
                      }
                      value={resetId}
                      onChange={(e) => setResetId(e.target.value)}
                      disabled={resetSubmitting}
                      required
                    />
                  </div>

                  {/* Phone Number Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide">Số điện thoại</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="Nhập số điện thoại đã đăng ký..."
                      value={resetSdt}
                      onChange={(e) => setResetSdt(e.target.value)}
                      disabled={resetSubmitting}
                      required
                    />
                  </div>

                  {/* Personal Email Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide">Email cá nhân</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="Nhập email cá nhân liên kết..."
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={resetSubmitting}
                      required
                    />
                  </div>

                  {/* Reason Field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6B4F3F] tracking-wide">Lý do cần cấp lại</label>
                    <textarea
                      className="input"
                      placeholder="Nhập lý do cần cấp lại mật khẩu..."
                      rows={3}
                      value={resetLydo}
                      onChange={(e) => setResetLydo(e.target.value)}
                      disabled={resetSubmitting}
                      style={{
                        resize: "none",
                        height: "auto",
                        paddingTop: 8,
                        paddingBottom: 8,
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-[0_24px_24px]">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowResetModal(false)}
                    disabled={resetSubmitting}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={resetSubmitting}
                  >
                    {resetSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
