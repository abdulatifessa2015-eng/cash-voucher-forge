import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/system.functions";
import { ACTION_LABEL } from "@/lib/auth-shared";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "سجل العمليات — نظام سند الصرف النقدي" },
      { name: "description", content: "سجل كامل لعمليات المستخدمين داخل النظام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { data: logs } = useQuery({ queryKey: ["audit-logs"], queryFn: () => listAuditLogs() });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">سجل العمليات</h2>
        <p className="text-sm text-muted-foreground">آخر 200 عملية مسجّلة.</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">المستخدم</th>
              <th className="px-4 py-3 font-medium">العملية</th>
              <th className="px-4 py-3 font-medium">رقم السند</th>
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => {
              const d = new Date(log.created_at);
              return (
                <tr key={log.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">{log.username ?? "—"}</td>
                  <td className="px-4 py-3">{ACTION_LABEL[log.action] ?? log.action}</td>
                  <td className="px-4 py-3">{log.voucher_serial ?? "—"}</td>
                  <td className="px-4 py-3" dir="ltr">{d.toLocaleDateString("ar-SA-u-ca-gregory")}</td>
                  <td className="px-4 py-3" dir="ltr">{d.toLocaleTimeString("ar-SA")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.details ?? "—"}</td>
                </tr>
              );
            })}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  لا توجد عمليات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
