import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getVoucher, updateVoucher } from "@/lib/voucher.functions";
import { VoucherForm } from "@/components/voucher/VoucherForm";
import type { VoucherData } from "@/components/voucher/voucher-types";
import { toast } from "sonner";

const voucherQuery = (id: string) =>
  queryOptions({
    queryKey: ["voucher", id],
    queryFn: () => getVoucher({ data: { id } }),
  });

export const Route = createFileRoute("/_authenticated/vouchers/$id")({
  head: () => ({
    meta: [
      { title: "عرض السند — نظام سند الصرف النقدي" },
      { name: "description", content: "عرض وتعديل بيانات سند الصرف النقدي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(voucherQuery(params.id)),
  errorComponent: ({ error }) => (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-4 text-sm text-muted-foreground">السند غير موجود.</div>,
  component: VoucherDetailPage,
});

function VoucherDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: voucher } = useSuspenseQuery(voucherQuery(id));
  const [busy, setBusy] = useState(false);

  const initial: VoucherData = {
    serial: voucher.serial,
    amountFigures: voucher.amountFigures === null ? "" : String(voucher.amountFigures),
    amountWords: voucher.amountWords,
    dateDay: voucher.dateDay,
    dateMonth: voucher.dateMonth,
    dateYear: voucher.dateYear,
    receiverName: voucher.receiverName,
    account: voucher.account,
    accountOther: voucher.accountOther,
    reason: voucher.reason,
    signReceiver: voucher.signReceiver,
    signAccountant: voucher.signAccountant,
    signManager: voucher.signManager,
  };

  async function handleSubmit(data: VoucherData) {
    setBusy(true);
    try {
      await updateVoucher({ data: { id, ...data } });
      toast.success("تم تحديث السند");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["voucher", id] }),
        queryClient.invalidateQueries({ queryKey: ["vouchers"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
      ]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر تحديث السند");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">السند رقم {voucher.serial}</h2>
          <p className="text-sm text-muted-foreground">
            الحالة: {voucher.status === "draft" ? "مسودّة" : voucher.status}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/vouchers"
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
          >
            عودة للقائمة
          </Link>
          <button
            onClick={() => navigate({ to: "/vouchers/new" })}
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent"
          >
            سند جديد
          </button>
        </div>
      </div>
      <VoucherForm initial={initial} submitLabel="حفظ التعديلات" busy={busy} onSubmit={handleSubmit} />
    </div>
  );
}
