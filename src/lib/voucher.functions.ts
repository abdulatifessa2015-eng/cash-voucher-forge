import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AccountKind = "aid" | "petty" | "other" | "none";

export interface VoucherRow {
  id: string;
  serial: string;
  amountFigures: number | null;
  amountWords: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  receiverName: string;
  account: AccountKind;
  accountOther: string;
  reason: string;
  signReceiver: string;
  signAccountant: string;
  signManager: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherListItem {
  id: string;
  serial: string;
  amountFigures: number | null;
  receiverName: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  account: AccountKind;
  status: string;
  createdBy: string;
  createdAt: string;
}

const accountEnum = z.enum(["aid", "petty", "other", "none"]);

const voucherInputSchema = z.object({
  serial: z.string().trim().min(1, "رقم السند مطلوب").max(50),
  amountFigures: z.string().trim().max(50).optional().default(""),
  amountWords: z.string().trim().max(500).optional().default(""),
  dateDay: z.string().trim().max(10).optional().default(""),
  dateMonth: z.string().trim().max(20).optional().default(""),
  dateYear: z.string().trim().max(10).optional().default(""),
  receiverName: z.string().trim().max(200).optional().default(""),
  account: accountEnum.optional().default("none"),
  accountOther: z.string().trim().max(200).optional().default(""),
  reason: z.string().trim().max(500).optional().default(""),
  signReceiver: z.string().trim().max(200).optional().default(""),
  signAccountant: z.string().trim().max(200).optional().default(""),
  signManager: z.string().trim().max(200).optional().default(""),
});

/** يحوّل نص المبلغ إلى رقم، أو null إن كان فارغًا/غير صالح. */
function toAmount(v: string): number | null {
  if (!v) return null;
  const n = Number(v.replace(/[,٬\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapRow(r: Record<string, unknown>): VoucherRow {
  const s = (k: string) => (r[k] as string | null) ?? "";
  return {
    id: r['id'] as string,
    serial: r['serial'] as string,
    amountFigures:
      r['amount_figures'] === null || r['amount_figures'] === undefined ? null : Number(r['amount_figures']),
    amountWords: s('amount_words'),
    dateDay: s('date_day'),
    dateMonth: s('date_month'),
    dateYear: s('date_year'),
    receiverName: s('receiver_name'),
    account: (s('account_kind') || 'none') as AccountKind,
    accountOther: s('account_other'),
    reason: s('reason'),
    signReceiver: s('sign_receiver'),
    signAccountant: s('sign_accountant'),
    signManager: s('sign_manager'),
    status: s('status') || 'draft',
    createdBy: r['created_by'] as string,
    createdAt: r['created_at'] as string,
    updatedAt: r['updated_at'] as string,
  };
}

/** يقترح رقم السند التالي بناءً على أعلى رقم موجود يملكه المستخدم رؤيته. */
export const getNextSerial = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("vouchers").select("serial");
    let max = 2000;
    for (const r of data ?? []) {
      const n = parseInt(r.serial as string, 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return { nextSerial: String(max + 1) };
  });

export const createVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => voucherInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("vouchers")
      .select("id")
      .eq("serial", data.serial)
      .maybeSingle();
    if (existing) throw new Error("رقم السند مستخدم مسبقًا");

    const insert = {
      serial: data.serial,
      amount_figures: toAmount(data.amountFigures),
      amount_words: data.amountWords || null,
      date_day: data.dateDay || null,
      date_month: data.dateMonth || null,
      date_year: data.dateYear || null,
      receiver_name: data.receiverName || null,
      account_kind: data.account,
      account_other: data.accountOther || null,
      reason: data.reason || null,
      sign_receiver: data.signReceiver || null,
      sign_accountant: data.signAccountant || null,
      sign_manager: data.signManager || null,
      status: "draft",
      created_by: context.userId,
    };

    const { data: row, error } = await context.supabase
      .from("vouchers")
      .insert(insert)
      .select("id, serial")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "voucher_created",
      voucher_id: row.id,
      voucher_serial: row.serial,
      details: `إنشاء سند رقم ${row.serial}`,
    });

    return { id: row.id, serial: row.serial };
  });

export const listVouchers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("vouchers")
      .select(
        "id, serial, amount_figures, receiver_name, date_day, date_month, date_year, account_kind, status, created_by, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      serial: r.serial as string,
      amountFigures: r.amount_figures === null ? null : Number(r.amount_figures),
      receiverName: (r.receiver_name as string) ?? "",
      dateDay: (r.date_day as string) ?? "",
      dateMonth: (r.date_month as string) ?? "",
      dateYear: (r.date_year as string) ?? "",
      account: ((r.account_kind as string) ?? "none") as AccountKind,
      status: (r.status as string) ?? "draft",
      createdBy: r.created_by as string,
      createdAt: r.created_at as string,
    })) as VoucherListItem[];
  });

export const getVoucher = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("vouchers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("السند غير موجود أو لا تملك صلاحية مشاهدته");
    return mapRow(row as Record<string, unknown>);
  });

export const updateVoucher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => voucherInputSchema.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("vouchers")
      .select("id, serial")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("السند غير موجود أو لا تملك صلاحية تعديله");

    const { data: dup } = await context.supabase
      .from("vouchers")
      .select("id")
      .eq("serial", data.serial)
      .neq("id", data.id)
      .maybeSingle();
    if (dup) throw new Error("رقم السند مستخدم مسبقًا");

    const update = {
      serial: data.serial,
      amount_figures: toAmount(data.amountFigures),
      amount_words: data.amountWords || null,
      date_day: data.dateDay || null,
      date_month: data.dateMonth || null,
      date_year: data.dateYear || null,
      receiver_name: data.receiverName || null,
      account_kind: data.account,
      account_other: data.accountOther || null,
      reason: data.reason || null,
      sign_receiver: data.signReceiver || null,
      sign_accountant: data.signAccountant || null,
      sign_manager: data.signManager || null,
    };
    const { error } = await context.supabase.from("vouchers").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);

    await context.supabase.from("audit_logs").insert({
      user_id: context.userId,
      action: "voucher_updated",
      voucher_id: data.id,
      voucher_serial: data.serial,
      details: `تعديل سند رقم ${data.serial}`,
    });
    return { ok: true };
  });

export const getReportsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    const [all, monthRows, yearRows] = await Promise.all([
      context.supabase.from("vouchers").select("id, amount_figures, account_kind, status, created_at"),
      context.supabase.from("vouchers").select("id, amount_figures").gte("created_at", startOfMonth),
      context.supabase.from("vouchers").select("id, amount_figures").gte("created_at", startOfYear),
    ]);

    const rows = all.data ?? [];
    const monthData = monthRows.data ?? [];
    const yearData = yearRows.data ?? [];
    const sum = (arr: { amount_figures: number | null }[]) =>
      arr.reduce((s, r) => s + (r.amount_figures ? Number(r.amount_figures) : 0), 0);

    return {
      total: rows.length,
      totalAmount: sum(rows as { amount_figures: number | null }[]),
      monthCount: monthData.length,
      monthAmount: sum(monthData as { amount_figures: number | null }[]),
      yearCount: yearData.length,
      yearAmount: sum(yearData as { amount_figures: number | null }[]),
      byAccount: {
        aid: rows.filter((r) => r.account_kind === "aid").length,
        petty: rows.filter((r) => r.account_kind === "petty").length,
        other: rows.filter((r) => r.account_kind === "other").length,
        none: rows.filter((r) => !r.account_kind || r.account_kind === "none").length,
      },
      byStatus: {
        draft: rows.filter((r) => (r.status ?? "draft") === "draft").length,
        other: rows.filter((r) => (r.status ?? "draft") !== "draft").length,
      },
    };
  });
