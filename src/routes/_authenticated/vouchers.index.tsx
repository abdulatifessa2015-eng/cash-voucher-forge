import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listVouchers, type VoucherListItem, type AccountKind } from "@/lib/voucher.functions";
import { FilePlus2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vouchers/")({
  head: () => ({
    meta: [
      { title: "السندات — نظام سند الصرف النقدي" },
      { name: "description", content: "قائمة سندات الصرف النقدي مع روابط العرض والتعديل." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VouchersListPage,
});

const ACCOUNT_LABEL: Record<AccountKind, string> = {
  aid: "المساعدات",
  petty: "النثريات",
  other: "أخرى",
  none: "—",
};

function VouchersListPage() {
  const { data: vouchers, isLoading } = useQuery({
    queryKey: ["vouchers"],
    queryFn: () => listVouchers(),
  });

  const rows = vouchers ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">السندات</h2>
          <p className="text-sm text-muted-foreground">يظهر كل موظف سنداته؛ ويظهر المدير جميع السندات.</p>
        </div>
        <Link
          to="/vouchers/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <FilePlus2 className="size-4" />
          إنشاء سند جديد
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">رقم السند</th>
              <th className="px-4 py-3 font-medium">المبلغ</th>
              <th className="px-4 py-3 font-medium">المستلم</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">الحساب</th>
              <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v: VoucherListItem) => {
              const dateStr = [v.dateDay, v.dateMonth, v.dateYear].filter(Boolean).join("/") || "—";
              return (
                <tr key={v.id} className="border-b border-border/60 last:border-0 hover:bg-accent/40">
                  <td className="px-4 py-3 font-semibold" dir="ltr">{v.serial}</td>
                  <td className="px-4 py-3" dir="ltr">
                    {v.amountFigures === null ? "—" : v.amountFigures.toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">{v.receiverName || "—"}</td>
                  <td className="px-4 py-3" dir="ltr">{dateStr}</td>
                  <td className="px-4 py-3">{ACCOUNT_LABEL[v.account]}</td>
                  <td className="px-4 py-3 text-muted-foreground" dir="ltr">
                    {new Date(v.createdAt).toLocaleDateString("ar-SA-u-ca-gregory")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to="/vouchers/$id"
                      params={{ id: v.id }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      عرض
                    </Link>
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  لا توجد سندات بعد
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  جارٍ التحميل…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
