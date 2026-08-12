import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/system.functions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ACTION_LABEL } from "@/lib/auth-shared";
import { FilePlus2, FileText, BarChart3, Users, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — نظام سند الصرف النقدي" },
      { name: "description", content: "إحصائيات السندات واختصارات النظام." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
    </div>
  );
}

function Dashboard() {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "admin";
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  const shortcuts = [
    { to: "/vouchers/new", label: "إنشاء سند جديد", icon: FilePlus2, admin: false },
    { to: "/vouchers", label: "السندات", icon: FileText, admin: false },
    { to: "/reports", label: "التقارير", icon: BarChart3, admin: false },
    { to: "/users", label: "المستخدمون", icon: Users, admin: true },
    { to: "/settings", label: "الإعدادات", icon: Settings, admin: true },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">مرحبًا، {user?.fullName ?? ""}</h2>
        <p className="text-sm text-muted-foreground">نظرة عامة على حركة السندات في النظام.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="عدد السندات" value={String(stats?.totalVouchers ?? 0)} />
        <Stat label="سندات اليوم" value={String(stats?.todayVouchers ?? 0)} />
        <Stat label="سندات الشهر" value={String(stats?.monthVouchers ?? 0)} />
        <Stat label="آخر سند" value={stats?.lastVoucher?.serial ?? "—"} />
        <Stat
          label="آخر عملية"
          value={stats?.lastAction ? (ACTION_LABEL[stats.lastAction.action] ?? stats.lastAction.action) : "—"}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">اختصارات</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {shortcuts
            .filter((s) => !s.admin || isAdmin)
            .map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                >
                  <Icon className="size-5 text-primary" />
                  {s.label}
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
