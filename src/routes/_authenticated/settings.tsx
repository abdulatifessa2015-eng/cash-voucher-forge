import { createFileRoute } from "@tanstack/react-router";
import { Phase2Notice } from "@/components/app/Phase2Notice";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — نظام سند الصرف النقدي" },
      { name: "description", content: "إعدادات النظام وإعدادات الطباعة والمعايرة مؤجلة إلى مرحلة مستقلة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Phase2Notice title="الإعدادات" note="إعدادات النظام وإعدادات الطباعة والمعايرة مؤجلة إلى مرحلة مستقلة." />,
});
