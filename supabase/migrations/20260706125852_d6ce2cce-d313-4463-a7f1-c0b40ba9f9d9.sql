
-- Enums
DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM ('particular','turma');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_status AS ENUM ('pendente','entregue','corrigida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabela: activities
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  created_by uuid,
  title text NOT NULL,
  description text,
  due_at timestamptz NOT NULL,
  type public.activity_type NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activities_target_check CHECK (
    (type = 'turma' AND class_id IS NOT NULL AND student_id IS NULL)
    OR (type = 'particular' AND student_id IS NOT NULL AND class_id IS NULL)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin all activities"
  ON public.activities FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant members manage activities"
  ON public.activities FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE INDEX activities_tenant_due_idx ON public.activities (tenant_id, due_at DESC);
CREATE INDEX activities_class_idx ON public.activities (class_id);
CREATE INDEX activities_student_idx ON public.activities (student_id);

CREATE TRIGGER activities_set_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: submissions
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status public.activity_status NOT NULL DEFAULT 'pendente',
  note text,
  submitted_at timestamptz,
  grade numeric(4,2),
  feedback text,
  graded_at timestamptz,
  graded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin all submissions"
  ON public.submissions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Tenant members manage submissions"
  ON public.submissions FOR ALL TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE INDEX submissions_activity_idx ON public.submissions (activity_id);
CREATE INDEX submissions_student_idx ON public.submissions (student_id, status);

CREATE TRIGGER submissions_set_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
