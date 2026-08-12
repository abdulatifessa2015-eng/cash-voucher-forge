import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  bootstrapAdmin,
  getBootstrapStatus,
  recordAuthEvent,
  resolveLoginEmail,
} from "@/lib/system.functions";
import { loginSchema, newUserSchema } from "@/lib/auth-shared";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — نظام طباعة سند الصرف النقدي" },
      {
        name: "description",
        content: "بوابة دخول الموظفين إلى نظام طباعة سند الصرف النقدي الخاص بجمعية البر بالأحساء.",
      },
      { property: "og:title", content: "تسجيل الدخول — نظام طباعة سند الصرف النقدي" },
      {
        property: "og:description",
        content: "بوابة دخول آمنة لموظفي ومديري نظام سند الصرف النقدي.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const bootstrap = useQuery({
    queryKey: ["bootstrap-status"],
    queryFn: () => getBootstrapStatus(),
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const needsBootstrap = bootstrap.data?.needsBootstrap === true;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setBusy(true);
    try {
      const res = await resolveLoginEmail({ data: { username: parsed.data.username } });
      if (res.disabled) {
        toast.error("هذا الحساب موقوف. راجع مدير النظام.");
        return;
      }
      if (!res.email) {
        toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: res.email,
        password: parsed.data.password,
      });
      if (error) {
        toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }
      await recordAuthEvent({ data: { action: "login" } });
      navigate({ to: "/dashboard", replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    const parsed = newUserSchema.omit({ role: true }).safeParse({ fullName, username, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setBusy(true);
    try {
      await bootstrapAdmin({ data: parsed.data });
      toast.success("تم إنشاء حساب المدير. سجّل الدخول الآن.");
      setPassword("");
      await bootstrap.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذّر إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-xl font-bold text-card-foreground">نظام طباعة سند الصرف النقدي</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {needsBootstrap ? "تهيئة أول حساب مدير للنظام" : "الرجاء تسجيل الدخول للمتابعة"}
          </p>
        </div>

        {bootstrap.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : needsBootstrap ? (
          <form onSubmit={handleBootstrap} className="space-y-4">
            <Input label="الاسم الكامل" value={fullName} onChange={setFullName} />
            <Input label="اسم المستخدم" value={username} onChange={setUsername} dir="ltr" />
            <Input
              label="كلمة المرور"
              value={password}
              onChange={setPassword}
              type="password"
              dir="ltr"
            />
            <Submit busy={busy} label="إنشاء حساب المدير" />
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input label="اسم المستخدم" value={username} onChange={setUsername} dir="ltr" />
            <Input
              label="كلمة المرور"
              value={password}
              onChange={setPassword}
              type="password"
              dir="ltr"
            />
            <Submit busy={busy} label="دخول" />
          </form>
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-card-foreground">{label}</span>
      <input
        type={type}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={100}
        className="h-11 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {busy && <Loader2 className="size-4 animate-spin" />}
      {label}
    </button>
  );
}
