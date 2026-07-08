
-- 1) Tabela de atribuição professor↔turma
CREATE TABLE public.class_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_teachers TO authenticated;
GRANT ALL ON public.class_teachers TO service_role;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
CREATE INDEX class_teachers_teacher_idx ON public.class_teachers(teacher_id);
CREATE INDEX class_teachers_class_idx ON public.class_teachers(class_id);

-- 2) Helpers
CREATE OR REPLACE FUNCTION public.teaches_class(_user_id uuid, _class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_teachers WHERE class_id = _class_id AND teacher_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin_instituicao')
  )
$$;

-- 3) RLS class_teachers
CREATE POLICY "Admins manage class_teachers" ON public.class_teachers
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));

CREATE POLICY "Teachers read own class_teachers" ON public.class_teachers
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

-- 4) Reescrever policies para escopo por professor
-- classes
DROP POLICY IF EXISTS "Staff manage tenant classes" ON public.classes;
CREATE POLICY "Admins manage tenant classes" ON public.classes
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers read assigned classes" ON public.classes
  FOR SELECT TO authenticated USING (public.teaches_class(auth.uid(), id));

-- activities
DROP POLICY IF EXISTS "Staff manage tenant activities" ON public.activities;
CREATE POLICY "Admins manage tenant activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers manage assigned activities" ON public.activities
  FOR ALL TO authenticated
  USING (
    tenant_id = public.current_tenant_id() AND (
      (class_id IS NOT NULL AND public.teaches_class(auth.uid(), class_id))
      OR (type = 'particular' AND created_by = auth.uid())
    )
  )
  WITH CHECK (
    tenant_id = public.current_tenant_id() AND created_by = auth.uid() AND (
      (class_id IS NOT NULL AND public.teaches_class(auth.uid(), class_id))
      OR (type = 'particular' AND student_id IS NOT NULL)
    )
  );

-- enrollments
DROP POLICY IF EXISTS "Staff manage tenant enrollments" ON public.enrollments;
CREATE POLICY "Admins manage tenant enrollments" ON public.enrollments
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers read enrollments of taught classes" ON public.enrollments
  FOR SELECT TO authenticated USING (public.teaches_class(auth.uid(), class_id));

-- attendance_sessions
DROP POLICY IF EXISTS "Staff manage attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Tenant members manage sessions" ON public.attendance_sessions;
CREATE POLICY "Admins manage attendance_sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers manage attendance_sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (public.teaches_class(auth.uid(), class_id))
  WITH CHECK (public.teaches_class(auth.uid(), class_id) AND tenant_id = public.current_tenant_id());

-- attendance_records
DROP POLICY IF EXISTS "Staff manage attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Tenant members manage records" ON public.attendance_records;
CREATE POLICY "Admins manage attendance_records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers manage attendance_records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.attendance_sessions s WHERE s.id = session_id AND public.teaches_class(auth.uid(), s.class_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.attendance_sessions s WHERE s.id = session_id AND public.teaches_class(auth.uid(), s.class_id)) AND tenant_id = public.current_tenant_id());

-- submissions
DROP POLICY IF EXISTS "Staff manage tenant submissions" ON public.submissions;
CREATE POLICY "Admins manage submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (tenant_id = public.current_tenant_id() AND public.is_tenant_admin(auth.uid(), tenant_id)));
CREATE POLICY "Teachers manage submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND (
      (a.class_id IS NOT NULL AND public.teaches_class(auth.uid(), a.class_id))
      OR (a.type = 'particular' AND a.created_by = auth.uid())
    ))
  )
  WITH CHECK (tenant_id = public.current_tenant_id());

-- students: professor lê alunos matriculados em turmas que leciona
CREATE POLICY "Teachers read students of taught classes" ON public.students
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = students.id AND public.teaches_class(auth.uid(), e.class_id)));
