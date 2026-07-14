
-- 1. tenant.type
DO $$ BEGIN
  CREATE TYPE public.tenant_type AS ENUM ('personal', 'teacher', 'institution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS type public.tenant_type NOT NULL DEFAULT 'institution';

-- 2. new role: coordenador
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordenador' BEFORE 'professor';

-- 3. plan_entitlements
DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'student_plus', 'teacher', 'institution');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.plan_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan public.plan_tier NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  quota INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan, feature_key)
);

GRANT SELECT ON public.plan_entitlements TO authenticated;
GRANT ALL ON public.plan_entitlements TO service_role;

ALTER TABLE public.plan_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read entitlements"
  ON public.plan_entitlements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manages entitlements"
  ON public.plan_entitlements FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_plan_entitlements_updated_at
  BEFORE UPDATE ON public.plan_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. seed: everything enabled by default (no gating yet)
INSERT INTO public.plan_entitlements (plan, feature_key, enabled) VALUES
  ('free',         'portal.view',       true),
  ('free',         'ai.chat',           true),
  ('free',         'library.read',      true),
  ('student_plus', 'portal.view',       true),
  ('student_plus', 'ai.chat',           true),
  ('student_plus', 'library.read',      true),
  ('student_plus', 'library.upload',    true),
  ('student_plus', 'community.post',    true),
  ('teacher',      'academic.classes',  true),
  ('teacher',      'academic.grades',   true),
  ('teacher',      'portal.view',       true),
  ('teacher',      'ai.chat',           true),
  ('teacher',      'library.read',      true),
  ('teacher',      'library.upload',    true),
  ('institution',  'academic.classes',  true),
  ('institution',  'academic.grades',   true),
  ('institution',  'academic.reports',  true),
  ('institution',  'portal.view',       true),
  ('institution',  'ai.chat',           true),
  ('institution',  'library.read',      true),
  ('institution',  'library.upload',    true),
  ('institution',  'community.post',    true)
ON CONFLICT (plan, feature_key) DO NOTHING;

-- 5. entitlements.can()
CREATE OR REPLACE FUNCTION public.entitlements_can(_user_id UUID, _feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT pe.enabled
    FROM public.profiles p
    JOIN public.tenants t ON t.id = p.tenant_id
    JOIN public.plan_entitlements pe
      ON pe.feature_key = _feature
     AND pe.plan = (CASE t.type
                      WHEN 'personal'    THEN 'free'::public.plan_tier
                      WHEN 'teacher'     THEN 'teacher'::public.plan_tier
                      WHEN 'institution' THEN 'institution'::public.plan_tier
                    END)
    WHERE p.id = _user_id
    LIMIT 1
  ), false)
$$;
