import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { entitlementsList } from "./entitlements.functions";
import type { FeatureKey } from "./features";

/**
 * Client hook: retorna o plano e a lista de features liberadas para
 * o tenant do usuário atual. Cacheia por 60s.
 */
export function useEntitlements() {
  const fn = useServerFn(entitlementsList);
  return useQuery({
    queryKey: ["entitlements"],
    queryFn: () => fn(),
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * `useEntitlement("ai.chat") -> { allowed, loading }`
 * Use para esconder/desabilitar UI de features não liberadas pelo plano.
 */
export function useEntitlement(feature: FeatureKey): {
  allowed: boolean;
  loading: boolean;
} {
  const q = useEntitlements();
  return {
    allowed: (q.data?.features ?? []).includes(feature),
    loading: q.isLoading,
  };
}