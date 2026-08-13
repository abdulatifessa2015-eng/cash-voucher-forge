import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { VoucherDocument } from "./VoucherDocument";
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
  serialSuggestion?: string;
}) {
  const [v, setV] = useState<VoucherData>(initial);
  const [serialTouched, setSerialTouched] = useState(false);
  const set = (patch: Partial<VoucherData>) => setV((p) => ({ ...p, ...patch }));

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
        <p className="text-sm font-semibold text-muted-foreground">معاينة مباشرة (200 × 119 مم)</p>
        <div
          className="overflow-auto rounded-lg border border-border bg-[#f3ecda] p-4"
          style={{ maxHeight: 560 }}
        >
          <div className="voucher-print-area">
            <VoucherDocument data={v} mode="full" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">المعاينة فقط — الطباعة غير مفعّلة في هذه المرحلة.</p>
      </div>
    </form>
  );
}
