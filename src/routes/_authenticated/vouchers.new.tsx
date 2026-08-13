import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getNextSerial, createVoucher } from "@/lib/voucher.functions";
import { VoucherForm } from "@/components/voucher/VoucherForm";
import { emptyVoucher } from "@/components/voucher/voucher-types";
import type { VoucherData } from "@/components/voucher/voucher-types";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vouchers/new")({
  head: () => ({
    meta: [
      { title: "إنشاء سند جديد — نظام سند الصرف النقدي" },
      {
        name: "description",
        content: "شاشة إدخال بيانات سند الصرف النقدي مع معاينة مباشرة بمقاس 200×119 مم.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewVoucherPage,
});

function NewVoucherPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data: serialData } = useQuery({
    queryKey: ["next-serial"],
    queryFn: () => getNextSerial(),
  });

  async function handleSubmit(data: VoucherData) {
    setBusy(true);
    try {
      const res = await createVoucher({ data });
      toast.success(`تم حفظ السند رقم ${res.serial}`);
      navigate({ to: "/vouchers/$id", params: { id: res.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر حفظ السند");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">إنشاء سند جديد</h2>
        <p className="text-sm text-muted-foreground">
          أدخل بيانات السند كما في النموذج الأصلي — المعاينة على اليسار بمقاس 200×119 مم.
        </p>
      </div>
      <VoucherForm
        initial={emptyVoucher}
        serialSuggestion={serialData?.nextSerial}
        submitLabel="حفظ السند"
        busy={busy}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
