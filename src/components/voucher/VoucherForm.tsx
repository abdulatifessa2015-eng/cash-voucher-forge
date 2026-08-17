import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Loader2, Printer } from "lucide-react";
import { VoucherDocument } from "./VoucherDocument";
import { VoucherOverlay } from "./VoucherOverlay";
import {
  DEFAULT_CALIBRATION,
  loadCalibration,
  saveCalibration,
  type Calibration,
} from "./voucher-layout";
import type { VoucherData, AccountKind } from "./voucher-types";
import "./voucher.css";

const ACCOUNT_OPTIONS: { value: AccountKind; label: string }[] = [
  { value: "aid", label: "المساعدات" },
  { value: "petty", label: "النثريات" },
  { value: "other", label: "أخرى" },
];

const inputCls =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-card-foreground">{label}</span>
      {children}
    </label>
  );
}

export function VoucherForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  serialSuggestion,
}: {
  initial: VoucherData;
  submitLabel: string;
  busy: boolean;
  onSubmit: (data: VoucherData) => Promise<void>;
  serialSuggestion?: string | undefined;
}) {
  const [v, setV] = useState<VoucherData>(initial);
  const [serialTouched, setSerialTouched] = useState(false);
  const [printMode, setPrintMode] = useState<"full" | "values">("full");
  const [calibration, setCalibration] = useState<Calibration>(DEFAULT_CALIBRATION);
  const [mounted, setMounted] = useState(false);
  const set = (patch: Partial<VoucherData>) => setV((p) => ({ ...p, ...patch }));

  useEffect(() => {
    setMounted(true);
    setCalibration(loadCalibration());
  }, []);

  const updateCalibration = (patch: Partial<Calibration>) => {
    setCalibration((prev) => {
      const next = { ...prev, ...patch };
      saveCalibration(next);
      return next;
    });
  };

  useEffect(() => {
    if (serialSuggestion && !serialTouched) set({ serial: serialSuggestion });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialSuggestion, serialTouched]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!v.serial.trim()) {
      toast.error("رقم السند مطلوب");
      return;
    }
    if (v.account === "other" && !v.accountOther.trim()) {
      toast.error("بيّن نوع الحساب «أخرى»");
      return;
    }
    await onSubmit(v);
  }

  return (
    <form onSubmit={handle} className="grid gap-5 lg:grid-cols-[440px_1fr]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="رقم السند">
            <input
              className={inputCls}
              dir="ltr"
              value={v.serial}
              onFocus={() => setSerialTouched(true)}
              onChange={(e) => {
                setSerialTouched(true);
                set({ serial: e.target.value });
              }}
            />
          </Field>
          <Field label="المبلغ رقمًا (ريال)">
            <input
              className={inputCls}
              dir="ltr"
              inputMode="decimal"
              value={v.amountFigures}
              onChange={(e) => set({ amountFigures: e.target.value })}
              placeholder="0.00"
            />
          </Field>
        </div>

        <Field label="المبلغ كتابةً">
          <input
            className={inputCls}
            value={v.amountWords}
            onChange={(e) => set({ amountWords: e.target.value })}
            placeholder="مئة ريال فقط لا غير"
          />
        </Field>

        <Field label="التاريخ (هجري — بعد 14)">
          <div className="flex gap-2">
            <input
              className={inputCls}
              dir="ltr"
              placeholder="يوم"
              value={v.dateDay}
              onChange={(e) => set({ dateDay: e.target.value })}
            />
            <input
              className={inputCls}
              dir="ltr"
              placeholder="شهر"
              value={v.dateMonth}
              onChange={(e) => set({ dateMonth: e.target.value })}
            />
            <input
              className={inputCls}
              dir="ltr"
              placeholder="سنة"
              value={v.dateYear}
              onChange={(e) => set({ dateYear: e.target.value })}
            />
          </div>
        </Field>

        <Field label="اسم المستلم">
          <input
            className={inputCls}
            value={v.receiverName}
            onChange={(e) => set({ receiverName: e.target.value })}
          />
        </Field>

        <Field label="من حساب">
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {ACCOUNT_OPTIONS.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="account"
                  className="size-4"
                  checked={v.account === o.value}
                  onChange={() => set({ account: o.value })}
                />
                {o.label}
              </label>
            ))}
            {v.account === "other" && (
              <input
                className={`${inputCls} max-w-[180px]`}
                value={v.accountOther}
                onChange={(e) => set({ accountOther: e.target.value })}
                placeholder="بيان أخرى"
              />
            )}
          </div>
        </Field>

        <Field label="وذلك عن">
          <textarea
            className={`${inputCls} h-20 resize-none py-2`}
            value={v.reason}
            onChange={(e) => set({ reason: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground">أسماء الموقّعين</p>
          <Field label="المستلم">
            <input
              className={inputCls}
              value={v.signReceiver}
              onChange={(e) => set({ signReceiver: e.target.value })}
            />
          </Field>
          <Field label="محاسب المركز">
            <input
              className={inputCls}
              value={v.signAccountant}
              onChange={(e) => set({ signAccountant: e.target.value })}
            />
          </Field>
          <Field label="مدير المركز">
            <input
              className={inputCls}
              value={v.signManager}
              onChange={(e) => set({ signManager: e.target.value })}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">معاينة مباشرة (200 × 119 مم)</p>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={printMode}
              onChange={(e) => setPrintMode(e.target.value as "full" | "values")}
            >
              <option value="full">طباعة كاملة (ورق أبيض)</option>
              <option value="values">البيانات فقط (ورق مطبوع مسبقًا)</option>
            </select>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Printer className="size-4" />
              طباعة
            </button>
          </div>
        </div>
        <div
          className="overflow-auto rounded-lg border border-border bg-[#f3ecda] p-4"
          style={{ maxHeight: 560 }}
        >
          {printMode === "full" ? (
            <VoucherDocument data={v} mode="full" />
          ) : (
            <VoucherOverlay data={v} calibration={calibration} guides />
          )}
        </div>

        {printMode === "values" && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
            <p className="w-full text-xs font-semibold text-muted-foreground">
              معايرة الطباعة (إزاحة بالمليمتر) — تُحفظ على هذا الجهاز
            </p>
            <label className="text-xs">
              إزاحة أفقية
              <input
                type="number"
                step="0.5"
                dir="ltr"
                className="mt-1 h-9 w-24 rounded-md border border-input bg-background px-2"
                value={calibration.offsetX}
                onChange={(e) => updateCalibration({ offsetX: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="text-xs">
              إزاحة رأسية
              <input
                type="number"
                step="0.5"
                dir="ltr"
                className="mt-1 h-9 w-24 rounded-md border border-input bg-background px-2"
                value={calibration.offsetY}
                onChange={(e) => updateCalibration({ offsetY: Number(e.target.value) || 0 })}
              />
            </label>
            <button
              type="button"
              className="h-9 rounded-md border border-input px-3 text-xs"
              onClick={() => updateCalibration(DEFAULT_CALIBRATION)}
            >
              تصفير
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          مقاس الورق 200×119 مم. في نافذة الطباعة: اختر حجم ورق مخصص 200×119 مم، المقياس 100% (الحجم
          الفعلي)، الهوامش «بدون»، وأزل خيار «ملاءمة الصفحة».
        </p>

        {mounted &&
          createPortal(
            <div className="voucher-print-root">
              {printMode === "full" ? (
                <VoucherDocument data={v} mode="full" />
              ) : (
                <VoucherOverlay data={v} calibration={calibration} />
              )}
            </div>,
            document.body,
          )}
      </div>
    </form>
  );
}
