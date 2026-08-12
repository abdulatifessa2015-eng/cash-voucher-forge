import { createFileRoute } from "@tanstack/react-router";
import { Phase2Notice } from "@/components/app/Phase2Notice";

export const Route = createFileRoute("/_authenticated/vouchers/")({
  head: () => ({
    meta: [
      { title: "السندات — نظام سند الصرف النقدي" },
      { name: "description", content: "قائمة السندات ستُفعّل بعد اعتماد شاشة إدخال بيانات السند." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Phase2Notice title="السندات" note="قائمة السندات ستُفعّل بعد اعتماد شاشة إدخال بيانات السند." />,
});
