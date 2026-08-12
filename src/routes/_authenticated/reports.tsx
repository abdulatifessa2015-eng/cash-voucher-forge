import { createFileRoute } from "@tanstack/react-router";
import { Phase2Notice } from "@/components/app/Phase2Notice";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — نظام سند الصرف النقدي" },
      { name: "description", content: "التقارير تُبنى بعد توفّر بيانات السندات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Phase2Notice title="التقارير" note="التقارير تُبنى بعد توفّر بيانات السندات." />,
});
