import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FeatureKey } from "./features";

/**
 * Verifica de forma centralizada se o usuário atual tem acesso a uma feature,
 * com base no plano do seu tenant. Chama a função SQL `entitlements_can`.
 *
 * Uso: `const ok = await entitlementsCan({ data: { feature: FEATURES.AI_CHAT } });`
 */
export const entitlementsCan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feature: FeatureKey }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: result, error } = await supabase.rpc("entitlements_can", {
      _user_id: userId,
      _feature: data.feature,
    });
    if (error) throw error;
    return { allowed: Boolean(result) };
  });

/**
 * Retorna todas as features liberadas para o plano do usuário atual.
 */
export const entitlementsList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, tenants!inner(type)")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) return { plan: null, features: [] as string[] };

    const tenantType = (profile as { tenants: { type: string } }).tenants.type;
    const plan =
      tenantType === "personal" ? "free" : tenantType === "teacher" ? "teacher" : "institution";

    const { data: rows } = await supabase
      .from("plan_entitlements")
      .select("feature_key, enabled, quota")
      .eq("plan", plan);

    return {
      plan,
      features: (rows ?? []).filter((r) => r.enabled).map((r) => r.feature_key),
    };
  });
