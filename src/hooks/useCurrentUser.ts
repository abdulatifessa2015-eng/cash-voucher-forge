import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  id: string;
  fullName: string;
  username: string;
  status: string;
  role: "admin" | "employee";
  lastLoginAt: string | null;
}

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, username, status, last_login_at")
        .eq("id", auth.user.id)
        .maybeSingle();
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!profile) return null;
      return {
        id: profile.id,
        fullName: profile.full_name,
        username: profile.username,
        status: profile.status,
        role: (roleRow?.role as "admin" | "employee") ?? "employee",
        lastLoginAt: profile.last_login_at,
      };
    },
    staleTime: 30_000,
  });
}
