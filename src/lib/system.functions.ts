import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { loginSchema, newUserSchema, usernameToEmail } from "@/lib/auth-shared";
import { z } from "zod";

/** Public: is the system still without any user? (first-run setup) */
export const getBootstrapStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { needsBootstrap: (count ?? 0) === 0 };
});

/** Public but self-disabling: creates the very first administrator account. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    newUserSchema.omit({ role: true }).extend({ fullName: z.string().trim().min(2).max(100) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) > 0) throw new Error("تمت تهيئة النظام مسبقًا");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(data.username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "تعذّر إنشاء الحساب");

    const userId = created.user.id;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, full_name: data.fullName, username: data.username.toLowerCase() });
    if (pErr) throw new Error(pErr.message);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      username: data.username.toLowerCase(),
      action: "system_bootstrap",
      details: "إنشاء حساب المدير الأول وتهيئة النظام",
    });
    return { ok: true };
  });

/** Public: resolves a username to its internal login identifier. */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginSchema.pick({ username: true }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, status")
      .eq("username", data.username.trim().toLowerCase())
      .maybeSingle();
    if (!profile) return { email: null, disabled: false };
    if (profile.status === "disabled") return { email: null, disabled: true };
    return { email: usernameToEmail(data.username), disabled: false };
  });

export const recordAuthEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ action: z.enum(["login", "logout"]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("username")
      .eq("id", context.userId)
      .maybeSingle();
    if (data.action === "login") {
      await context.supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", context.userId);
    }
    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      username: profile?.username ?? null,
      action: data.action,
      details: data.action === "login" ? "دخول ناجح إلى النظام" : "خروج من النظام",
    });
    return { ok: true };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [total, today, month, last, lastLog] = await Promise.all([
      context.supabase.from("vouchers").select("id", { count: "exact", head: true }),
      context.supabase
        .from("vouchers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfDay),
      context.supabase
        .from("vouchers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth),
      context.supabase
        .from("vouchers")
        .select("serial, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("audit_logs")
        .select("action, username, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      totalVouchers: total.count ?? 0,
      todayVouchers: today.count ?? 0,
      monthVouchers: month.count ?? 0,
      lastVoucher: last.data ?? null,
      lastAction: lastLog.data ?? null,
    };
  });

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("id, username, action, voucher_serial, details, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرّح");
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, username, status, created_at, last_login_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    return (data ?? []).map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.id)?.role ?? "employee",
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => newUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرّح");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const username = data.username.trim().toLowerCase();
    const { data: exists } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (exists) throw new Error("اسم المستخدم مستخدم مسبقًا");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(username),
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "تعذّر إنشاء المستخدم");

    await supabaseAdmin
      .from("profiles")
      .insert({ id: created.user.id, full_name: data.fullName, username });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_created",
      details: `إنشاء المستخدم ${username} بصلاحية ${data.role}`,
    });
    return { ok: true };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "employee"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرّح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_role_changed",
      details: `تعديل صلاحية المستخدم إلى ${data.role}`,
    });
    return { ok: true };
  });

export const updateUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["active", "disabled"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرّح");
    if (data.userId === context.userId) throw new Error("لا يمكنك تعطيل حسابك");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ status: data.status }).eq("id", data.userId);
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.status === "disabled" ? "876000h" : "none",
    });
    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_status_changed",
      details: `تغيير حالة المستخدم إلى ${data.status === "active" ? "نشط" : "موقوف"}`,
    });
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ userId: z.string().uuid(), password: z.string().min(8).max(72) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("غير مصرّح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "user_password_reset",
      details: "إعادة تعيين كلمة مرور مستخدم",
    });
    return { ok: true };
  });
