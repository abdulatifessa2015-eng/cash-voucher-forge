import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "نظام طباعة سند الصرف النقدي" },
      {
        name: "description",
        content: "نظام داخلي لتعبئة وطباعة سند الصرف النقدي بمقاس 200×119 مم.",
      },
      { property: "og:title", content: "نظام طباعة سند الصرف النقدي" },
      { property: "og:description", content: "نظام داخلي لإدارة وطباعة سندات الصرف النقدي." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    throw redirect({ to: data.user ? "/dashboard" : "/auth" });
  },
  component: () => null,
});
