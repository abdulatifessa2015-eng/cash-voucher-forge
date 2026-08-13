import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReportsData } from "@/lib/voucher.functions";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — نظام سند الصرف النقدي" },
      { name: "description", content: "إحصائيات وملخصات سندات الصرف النقدي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportsPage,
});

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-left font-semibold tabular-nums">{count}</span>
    </div>
  );
}

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => getReportsData(),
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">جارٍ تحميل التقارير…</p>;
  }

  const fmt = (n: number) => n.toLocaleString("en-US");
  const maxAccount = Math.max(1, data.byAccount.aid, data.byAccount.petty, data.byAccount.other, data.byAccount.none);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">التقارير</h2>
        <p className="text-sm text-muted-foreground">ملخص حركة السندات والمبالغ.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="إجمالي السندات" value={String(data.total)} />
        <Stat label="إجمالي المبالغ" value={`${fmt(data.totalAmount)} ريال`} />
        <Stat label="سندات هذا الشهر" value={String(data.monthCount)} sub={`${fmt(data.monthAmount)} ريال`} />
        <Stat label="سندات هذا العام" value={String(data.yearCount)} sub={`${fmt(data.yearAmount)} ريال`} />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-card-foreground">توزيع السندات حسب نوع الحساب</h3>
        <div className="space-y-3">
          <Bar label="المساعدات" count={data.byAccount.aid} max={maxAccount} />
          <Bar label="النثريات" count={data.byAccount.petty} max={maxAccount} />
          <Bar label="أخرى" count={data.byAccount.other} max={maxAccount} />
          <Bar label="غير محدد" count={data.byAccount.none} max={maxAccount} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">حسب الحالة</h3>
        <div className="flex gap-6 text-sm">
          <span className="text-muted-foreground">
            مسودّة: <span className="font-semibold text-card-foreground">{data.byStatus.draft}</span>
          </span>
          {data.byStatus.other > 0 && (
            <span className="text-muted-foreground">
              أخرى: <span className="font-semibold text-card-foreground">{data.byStatus.other}</span>
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
