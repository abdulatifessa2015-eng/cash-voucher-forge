import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { recordAuthEvent } from "@/lib/system.functions";
import { ROLE_LABEL } from "@/lib/auth-shared";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  BarChart3,
  Users,
  Settings,
  ScrollText,
  LogOut,
} from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, adminOnly: false },
  { to: "/vouchers", label: "السندات", icon: FileText, adminOnly: false },
  { to: "/vouchers/new", label: "إنشاء سند جديد", icon: FilePlus2, adminOnly: false },
  { to: "/reports", label: "التقارير", icon: BarChart3, adminOnly: false },
  { to: "/voucher-analysis", label: "تحليل السند", icon: FileText, adminOnly: false },
  { to: "/audit", label: "سجل العمليات", icon: ScrollText, adminOnly: false },
  { to: "/users", label: "المستخدمون", icon: Users, adminOnly: true },
  { to: "/settings", label: "الإعدادات", icon: Settings, adminOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = user?.role === "admin";

  async function handleSignOut() {
    try {
      await recordAuthEvent({ data: { action: "logout" } });
    } catch {
      /* الخروج يتم في كل الأحوال */
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="text-sm font-bold leading-6">نظام طباعة</p>
          <p className="text-sm font-bold leading-6">سند الصرف النقدي</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.filter((i) => !i.adminOnly || isAdmin).map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
          المرحلة الأولى — الطباعة غير مفعّلة بعد
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-5 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">نظام طباعة سند الصرف النقدي</h1>
            <p className="text-xs text-muted-foreground">جمعية البر بالأحساء</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-semibold">{user?.fullName ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-accent"
            >
              <LogOut className="size-4" />
              خروج
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/40 p-5">{children}</main>
      </div>
    </div>
  );
}
