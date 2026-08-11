import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VoucherDocument } from "@/components/voucher/VoucherDocument";
import { emptyVoucher, type VoucherData } from "@/components/voucher/voucher-types";
import "@/components/voucher/voucher.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظام طباعة سند الصرف النقدي" },
      {
        name: "description",
        content:
          "نظام لتعبئة وطباعة سند الصرف النقدي بمقاس 200×119 مم مطابقًا للسند الورقي الأصلي.",
      },
      { property: "og:title", content: "نظام طباعة سند الصرف النقدي" },
      {
        property: "og:description",
        content: "تعبئة بيانات سند الصرف النقدي وطباعتها بالمقاس الحقيقي 200×119 مم.",
      },
    ],
  }),
  component: Index,
});

function Field({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <input
        className="h-10 rounded-md border border-input bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Index() {
  const [data, setData] = useState<VoucherData>(emptyVoucher);
  const [mode, setMode] = useState<"full" | "values">("full");
  const set = (k: keyof VoucherData) => (v: string) =>
    setData((d) => ({ ...d, [k]: v }));

  return (
    <div dir="rtl" className="min-h-screen bg-muted/40 p-6">
      <header className="mx-auto mb-6 max-w-[1400px]">
        <h1 className="text-2xl font-bold text-foreground">نظام طباعة سند الصرف النقدي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          المرحلة الأولى — نموذج طباعة مطابق للسند الأصلي بمقاس 200 × 119 مم.
        </p>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold text-card-foreground">بيانات السند</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم السند" value={data.serial} onChange={set("serial")} />
            <Field label="المبلغ (ريال)" value={data.amountFigures} onChange={set("amountFigures")} />
            <Field label="اليوم" value={data.dateDay} onChange={set("dateDay")} />
            <Field label="الشهر" value={data.dateMonth} onChange={set("dateMonth")} />
            <Field label="السنة (بعد ١٤)" value={data.dateYear} onChange={set("dateYear")} />
            <Field
              label="لقد استلمت أنا"
              value={data.receiverName}
              onChange={set("receiverName")}
              className="col-span-2"
            />
            <Field
              label="مبلغ وقدره (كتابة)"
              value={data.amountWords}
              onChange={set("amountWords")}
              className="col-span-2"
            />
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">من حساب</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-foreground"
                value={data.account}
                onChange={(e) => set("account")(e.target.value)}
              >
                <option value="none">— بدون تحديد —</option>
                <option value="aid">المساعدات</option>
                <option value="petty">النثريات</option>
                <option value="other">أخرى</option>
              </select>
            </label>
            {data.account === "other" && (
              <Field
                label="تحديد (أخرى)"
                value={data.accountOther}
                onChange={set("accountOther")}
                className="col-span-2"
              />
            )}
            <Field label="وذلك عن" value={data.reason} onChange={set("reason")} className="col-span-2" />
            <Field label="اسم المستلم" value={data.signReceiver} onChange={set("signReceiver")} />
            <Field label="اسم محاسب المركز" value={data.signAccountant} onChange={set("signAccountant")} />
            <Field
              label="اسم مدير المركز"
              value={data.signManager}
              onChange={set("signManager")}
              className="col-span-2"
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">نمط الطباعة</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("full")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${mode === "full" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground"}`}
              >
                السند كاملاً
              </button>
              <button
                onClick={() => setMode("values")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${mode === "values" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-foreground"}`}
              >
                البيانات فقط (ورق مطبوع)
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              طباعة
            </button>
          </div>
        </section>

        <section className="overflow-auto rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold text-card-foreground">
            معاينة الطباعة — 200 × 119 مم
          </h2>
          <div className="voucher-print-area origin-top-right">
            <VoucherDocument data={data} mode={mode} />
          </div>
        </section>
      </div>
    </div>
  );
}
