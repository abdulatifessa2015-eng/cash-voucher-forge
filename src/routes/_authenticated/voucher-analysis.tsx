import { createFileRoute } from "@tanstack/react-router";
import { VoucherDocument } from "@/components/voucher/VoucherDocument";
import { emptyVoucher } from "@/components/voucher/voucher-types";
import "@/components/voucher/voucher.css";

export const Route = createFileRoute("/_authenticated/voucher-analysis")({
  head: () => ({
    meta: [
      { title: "تحليل السند — نظام سند الصرف النقدي" },
      {
        name: "description",
        content: "تصنيف عناصر سند الصرف النقدي إلى ثابتة ومتغيرة مع معاينة النموذج.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalysisPage,
});

const FIXED = [
  "«جمعية البر بالأحساء» داخل مستطيل الترويسة",
  "«مسجلة بوزارة الشؤون الاجتماعية برقم : 34»",
  "عنوان السند: «سند صرف نقدي»",
  "خانة «المبلغ» مع رمز الريال",
  "نص «التاريخ : / / 14»",
  "نص «لقد استلمت أنا»",
  "نص «مبلغ وقدره»",
  "نص «من حساب» مع المربعات: المساعدات / النثريات / أخرى",
  "نص «وذلك عن»",
  "مسميات التواقيع: المستلم — محاسب المركز — مدير المركز",
  "الخطوط المنقّطة وحدود الخانات والمربعات",
  "الشريط الجانبي: الشعار، اسم المركز، العنوان، الهاتف، الموقع الإلكتروني",
  "رقم السند المطبوع مسبقًا (2001)",
];

const VARIABLE = [
  "المبلغ رقمًا",
  "اليوم / الشهر / السنة (بعد 14)",
  "اسم المستلم (لقد استلمت أنا)",
  "المبلغ كتابةً",
  "تحديد الحساب (المساعدات / النثريات / أخرى + نص أخرى)",
  "بيان «وذلك عن»",
  "اسم المستلم في التوقيع",
  "اسم محاسب المركز",
  "اسم مدير المركز",
];

const PHASE2_FIELDS = [
  "رقم السند (serial)",
  "المبلغ رقمًا (amount_figures)",
  "المبلغ كتابةً (amount_words)",
  "اليوم / الشهر / السنة (date_day, date_month, date_year)",
  "اسم المستلم (receiver_name)",
  "نوع الحساب (account_kind) + تحديد أخرى (account_other)",
  "وذلك عن (reason)",
  "توقيع المستلم (sign_receiver)",
  "محاسب المركز (sign_accountant)",
  "مدير المركز (sign_manager)",
];

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-semibold text-card-foreground">{title}</h3>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary">•</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AnalysisPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">تحليل سند الصرف النقدي</h2>
        <p className="text-sm text-muted-foreground">
          المقاس المعتمد 200 × 119 مم — الطباعة والمعايرة مؤجلة إلى مرحلة مستقلة.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <List title="أ) العناصر الثابتة" items={FIXED} />
        <List title="ب) العناصر المتغيرة" items={VARIABLE} />
        <List title="د) حقول شاشة الإدخال (المرحلة الثانية)" items={PHASE2_FIELDS} />
      </div>

      <section className="overflow-auto rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-card-foreground">ج) معاينة السند كما فُهم — 200 × 119 مم</h3>
        <div className="voucher-print-area origin-top-right">
          <VoucherDocument data={emptyVoucher} mode="full" />
        </div>
      </section>
    </div>
  );
}
