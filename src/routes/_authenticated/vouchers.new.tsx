import { createFileRoute } from "@tanstack/react-router";
import { Phase2Notice } from "@/components/app/Phase2Notice";

export const Route = createFileRoute("/_authenticated/vouchers/new")({
  head: () => ({
    meta: [
      { title: "إنشاء سند جديد — نظام سند الصرف النقدي" },
      { name: "description", content: "شاشة إدخال بيانات السند تُبنى في المرحلة الثانية بعد اعتماد قائمة الحقول." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Phase2Notice title="إنشاء سند جديد" note="شاشة إدخال بيانات السند تُبنى في المرحلة الثانية بعد اعتماد قائمة الحقول." />,
});
