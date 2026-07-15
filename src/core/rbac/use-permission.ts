import { useSession } from "@/hooks/use-session";
import { canAny, type AppRole, type Permission } from "./permissions";

/**
 * Client-side hook: retorna true se algum dos papéis do usuário atual
 * tem a permissão pedida, segundo a matriz central `MATRIX`.
 *
 * Use isto em vez de espalhar `if (session.isAdmin)` pela UI:
 *   const canManage = usePermission(PERMISSIONS.CLASS_MANAGE);
 */
export function usePermission(permission: Permission): boolean {
  const session = useSession();
  const roles = (session.data?.roles ?? []) as AppRole[];
  return canAny(roles, permission);
}

export function usePermissions(): {
  roles: AppRole[];
  can: (p: Permission) => boolean;
  loading: boolean;
} {
  const session = useSession();
  const roles = (session.data?.roles ?? []) as AppRole[];
  return {
    roles,
    can: (p) => canAny(roles, p),
    loading: session.isLoading,
  };
}