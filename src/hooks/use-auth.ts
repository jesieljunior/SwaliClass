import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin_instituicao";

export interface AuthState {
  user: User | null;
  loading: boolean;
  roles: AppRole[];
  tenantId: string | null;
  fullName: string | null;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRoles([]);
        setTenantId(null);
        setFullName(null);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("tenant_id, full_name").eq("id", user.id).maybeSingle(),
    ]).then(([rolesRes, profileRes]) => {
      if (cancelled) return;
      setRoles((rolesRes.data ?? []).map((r) => r.role as AppRole));
      setTenantId(profileRes.data?.tenant_id ?? null);
      setFullName(profileRes.data?.full_name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, loading, roles, tenantId, fullName };
}

export function initials(name: string | null | undefined, email: string | null | undefined) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}
