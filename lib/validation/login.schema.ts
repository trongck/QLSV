import { z } from "zod";

// ─── Login Schema ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email hoặc mã tài khoản.")
    .email("Định dạng email không hợp lệ."),
  matkhau: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự."),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ─── Validate Helper ──────────────────────────────────────────────────────────

export function validateLogin(data: unknown): {
  ok: boolean;
  errors: Partial<Record<keyof LoginSchema, string>>;
} {
  const result = loginSchema.safeParse(data);
  if (result.success) return { ok: true, errors: {} };

  const errors: Partial<Record<keyof LoginSchema, string>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof LoginSchema;
    if (!errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}
