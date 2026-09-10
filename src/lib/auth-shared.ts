import { z } from "zod";

/** Internal e-mail domain used to map usernames onto the auth provider. */
export const USERNAME_EMAIL_DOMAIN = "sanad.local";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "اسم المستخدم يجب ألا يقل عن 3 أحرف")
  .max(32, "اسم المستخدم طويل جدًا")
  .regex(/^[a-zA-Z0-9._-]+$/, "اسم المستخدم يقبل الحروف الإنجليزية والأرقام و . _ - فقط");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف")
  .max(72, "كلمة المرور طويلة جدًا");

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة").max(72),
});

export const newUserSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم مطلوب").max(100),
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(["admin", "employee"]),
});

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "مدير / مسؤول",
  employee: "موظف",
};

export const ACTION_LABEL: Record<string, string> = {
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
  user_created: "إنشاء مستخدم",
  user_role_changed: "تعديل صلاحية",
  user_status_changed: "تغيير حالة مستخدم",
  user_password_reset: "إعادة تعيين كلمة المرور",
  system_bootstrap: "تهيئة النظام",
  voucher_created: "إنشاء سند",
  voucher_updated: "تعديل سند",
};
