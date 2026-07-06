
-- 1) Prevent tenant_id change on profiles (fixes current_tenant_id tenant hijack)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Cannot modify tenant_id';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_change ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_change();

-- 2) Hide invite tokens from clients (only service_role can read the token column)
REVOKE SELECT (token) ON public.invites FROM anon, authenticated;

-- 3) Add write policies to user_roles (block self-privilege-escalation)
CREATE POLICY "Super admin inserts roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin updates roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin deletes roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- 4) Revoke direct EXECUTE on SECURITY DEFINER helpers from client roles.
-- RLS policies continue to evaluate them because policies run as the table owner.
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
