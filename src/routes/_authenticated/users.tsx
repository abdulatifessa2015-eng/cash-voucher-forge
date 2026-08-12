import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, listUsers, updateUserRole, updateUserStatus } from "@/lib/system.functions";
import { newUserSchema, ROLE_LABEL } from "@/lib/auth-shared";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "المستخدمون — نظام سند الصرف النقدي" },
      { name: "description", content: "إدارة مستخدمي النظام وصلاحياتهم." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { data: me, isLoading } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = me?.role === "admin";

  useEffect(() => {
    if (!isLoading && me && !isAdmin) navigate({ to: "/dashboard", replace: true });
  }, [isLoading, me, isAdmin, navigate]);

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(),
    enabled: isAdmin,
  });

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "employee" as "employee" | "admin",
  });

  const create = useMutation({
    mutationFn: (input: typeof form) => createUser({ data: input }),
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم");
      setForm({ fullName: "", username: "", password: "", role: "employee" });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["audit-logs"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الإنشاء"),
  });

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "employee" }) => updateUserRole({ data: v }),
    onSuccess: () => {
      toast.success("تم تعديل الصلاحية");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر التعديل"),
  });

  const changeStatus = useMutation({
    mutationFn: (v: { userId: string; status: "active" | "disabled" }) =>
      updateUserStatus({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر التحديث"),
  });

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">المستخدمون</h2>
        <p className="text-sm text-muted-foreground">إضافة المستخدمين وتعديل صلاحياتهم وحالاتهم.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = newUserSchema.safeParse(form);
          if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
            return;
          }
          create.mutate(parsed.data);
        }}
        className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-5"
      >
        <label className="space-y-1 text-sm md:col-span-1">
          <span className="text-muted-foreground">الاسم الكامل</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            value={form.fullName}
            maxLength={100}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">اسم المستخدم</span>
          <input
            dir="ltr"
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            value={form.username}
            maxLength={32}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">كلمة المرور</span>
          <input
            dir="ltr"
            type="password"
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            value={form.password}
            maxLength={72}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">الصلاحية</span>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "employee" | "admin" })}
          >
            <option value="employee">موظف</option>
            <option value="admin">مدير / مسؤول</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={create.isPending}
          className="mt-auto h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          إضافة مستخدم
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">اسم المستخدم</th>
              <th className="px-4 py-3 font-medium">الصلاحية</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">آخر دخول</th>
              <th className="px-4 py-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">{u.full_name}</td>
                <td className="px-4 py-3" dir="ltr">{u.username}</td>
                <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
                <td className="px-4 py-3">{u.status === "active" ? "نشط" : "موقوف"}</td>
                <td className="px-4 py-3" dir="ltr">
                  {u.last_login_at ? new Date(u.last_login_at).toLocaleString("ar-SA-u-ca-gregory") : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        changeRole.mutate({
                          userId: u.id,
                          role: u.role === "admin" ? "employee" : "admin",
                        })
                      }
                      className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
                    >
                      {u.role === "admin" ? "تحويل إلى موظف" : "تحويل إلى مدير"}
                    </button>
                    {u.id !== me?.id && (
                      <button
                        onClick={() =>
                          changeStatus.mutate({
                            userId: u.id,
                            status: u.status === "active" ? "disabled" : "active",
                          })
                        }
                        className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
                      >
                        {u.status === "active" ? "إيقاف" : "تفعيل"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
