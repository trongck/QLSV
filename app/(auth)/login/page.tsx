"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useAuth } from "@/hook/useAuth";
import Image from "next/image";
import styles from "./login.module.css";

// ─── Role Configuration ───────────────────────────────────────────────────────
type Role = "sinhvien" | "giangvien" | "quantri";

const ROLES: { key: Role; label: string; placeholder: string; hint: string }[] =
  [
    {
      key: "sinhvien",
      label: "Sinh viên",
      placeholder: "Nhập mã sinh viên: (VD:687840)",
      hint: "Mã sinh viên",
    },
    {
      key: "giangvien",
      label: "Giảng viên",
      placeholder: "Nhập mã giảng viên",
      hint: "Mã giảng viên",
    },
    {
      key: "quantri",
      label: "Admin",
      placeholder: "Nhập tài khoản Admin",
      hint: "Tài khoản Admin",
    },
  ];

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login, submitting, error, setError } = useAuth();

  const [role, setRole] = useState<Role>("sinhvien");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [mounted, setMounted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    emailRef.current?.focus();
  }, []);

  const currentRole = ROLES.find((r) => r.key === role)!;

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
    if (!email.trim())
      errs.email = "Vui lòng nhập " + currentRole.hint.toLowerCase() + ".";
    if (!password.trim()) errs.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) errs.password = "Mật khẩu tối thiểu 6 ký tự.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await login({ email: email.trim(), matkhau: password });
  };

  return (
    <div className={styles.page}>
      <div className={styles.blobTopLeft} aria-hidden />
      <div className={styles.blobBotRight} aria-hidden />

      {/* LEFT PANEL */}
      <aside className={`${styles.left} ${mounted ? styles.leftVisible : ""}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
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
          <span className={styles.logoWord}>Hệ Thống quản lý sinh viên</span>
        </div>

        <div className={styles.introImageWrapper}>
          <Image
            src="/intro.png"
            alt="Giới thiệu hệ thống"
            width={600}
            height={500}
            className={styles.introImage}
            priority
          />
        </div>
      </aside>

      {/* RIGHT PANEL */}
      <main className={`${styles.right} ${mounted ? styles.rightVisible : ""}`}>
        <div className={styles.mobileLogo} aria-label="Lumen University">
          <div className={styles.logoIcon}>
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
          <span className={styles.logoWord} style={{ fontSize: "15px" }}>
            Hệ thống quản lý sinh viên
          </span>
        </div>

        <div className={styles.formWrap}>
          <p className={styles.eyebrow}>Hệ thống quản lý sinh viên - VNUA</p>
          <h1 className={styles.heading}>
            Xin chào,
            <br />
            đăng nhập nào.
          </h1>
          <p className={styles.subtitle}>
            Nhập thông tin của bạn để tiếp tục vào hệ thống.
          </p>

          {/* Role Tabs */}
          <div
            className={styles.roleTabs}
            role="tablist"
            aria-label="Chọn vai trò đăng nhập"
          >
            {ROLES.map((r) => (
              <button
                key={r.key}
                id={`role-tab-${r.key}`}
                role="tab"
                aria-selected={role === r.key}
                className={`${styles.roleTab} ${role === r.key ? styles.roleTabActive : ""}`}
                onClick={() => {
                  setRole(r.key);
                  setEmail("");
                  setPassword("");
                  setFieldErrors({});
                  setError(null);
                }}
                type="button"
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div
              className={styles.errorBanner}
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
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="field-email">
                {currentRole.hint}
              </label>
              <input
                id="field-email"
                ref={emailRef}
                type="text"
                autoComplete="username"
                placeholder={currentRole.placeholder}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`input ${fieldErrors.email ? "error" : ""} ${styles.inputOverride}`}
                aria-describedby={fieldErrors.email ? "err-email" : undefined}
                aria-invalid={!!fieldErrors.email}
                disabled={submitting}
              />
              {fieldErrors.email && (
                <span id="err-email" className={styles.fieldError} role="alert">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="field-password">
                  Mật khẩu
                </label>
              </div>
              <div className={styles.pwWrap}>
                <input
                  id="field-password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`input ${fieldErrors.password ? "error" : ""} ${styles.inputOverride}`}
                  aria-describedby={fieldErrors.password ? "err-pw" : undefined}
                  aria-invalid={!!fieldErrors.password}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
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
                <span id="err-pw" className={styles.fieldError} role="alert">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={styles.checkbox}
                disabled={submitting}
              />
              <span className={styles.rememberText}>Duy trì đăng nhập</span>
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
                    className={`animate-spin ${styles.spinner}`}
                    aria-hidden
                  />
                  Đang đăng nhập…
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <p className={styles.activateText}>
            Bạn quên mật khẩu?{" "}
            <a
              href="#"
              className={styles.activateLink}
              onClick={(e) => e.preventDefault()}
            >
              Quên mật khẩu
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
