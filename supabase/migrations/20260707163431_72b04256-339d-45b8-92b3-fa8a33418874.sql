-- Helpers
CREATE OR REPLACE FUNCTION public.is_tenant_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin_instituicao','professor')
  )
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.student_in_class(_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.class_id = _class_id AND s.user_id = auth.uid() AND e.active = true
  )
$$;

-- STUDENTS
DROP POLICY IF EXISTS "Tenant members manage students" ON public.students;
DROP POLICY IF EXISTS "Super admin all students" ON public.students;
CREATE POLICY "Staff manage tenant students" ON public.students
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads self" ON public.students
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- CLASSES
DROP POLICY IF EXISTS "Tenant members manage classes" ON public.classes;
DROP POLICY IF EXISTS "Super admin all classes" ON public.classes;
CREATE POLICY "Staff manage tenant classes" ON public.classes
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads own classes" ON public.classes
  FOR SELECT TO authenticated
  USING (student_in_class(id));

-- ENROLLMENTS
DROP POLICY IF EXISTS "Tenant members manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Super admin all enrollments" ON public.enrollments;
CREATE POLICY "Staff manage tenant enrollments" ON public.enrollments
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads own enrollments" ON public.enrollments
  FOR SELECT TO authenticated
  USING (student_id = current_student_id());

-- COURSES
DROP POLICY IF EXISTS "Tenant members manage courses" ON public.courses;
DROP POLICY IF EXISTS "Super admin all courses" ON public.courses;
CREATE POLICY "Staff manage tenant courses" ON public.courses
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads tenant courses" ON public.courses
  FOR SELECT TO authenticated
  USING (tenant_id = current_tenant_id() AND current_student_id() IS NOT NULL);

-- ACTIVITIES
DROP POLICY IF EXISTS "Tenant members manage activities" ON public.activities;
DROP POLICY IF EXISTS "Super admin all activities" ON public.activities;
CREATE POLICY "Staff manage tenant activities" ON public.activities
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads own activities" ON public.activities
  FOR SELECT TO authenticated
  USING (
    (type = 'particular' AND student_id = current_student_id())
    OR (type = 'turma' AND class_id IS NOT NULL AND student_in_class(class_id))
  );

-- SUBMISSIONS
DROP POLICY IF EXISTS "Tenant members manage submissions" ON public.submissions;
DROP POLICY IF EXISTS "Super admin all submissions" ON public.submissions;
CREATE POLICY "Staff manage tenant submissions" ON public.submissions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads own submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (student_id = current_student_id());
CREATE POLICY "Student updates own submission note" ON public.submissions
  FOR UPDATE TO authenticated
  USING (student_id = current_student_id())
  WITH CHECK (
    student_id = current_student_id()
    AND status IN ('pendente','entregue')
    AND grade IS NULL
  );

-- ATTENDANCE
DROP POLICY IF EXISTS "Tenant members manage attendance_sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Super admin all attendance_sessions" ON public.attendance_sessions;
CREATE POLICY "Staff manage attendance_sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));

DROP POLICY IF EXISTS "Tenant members manage attendance_records" ON public.attendance_records;
DROP POLICY IF EXISTS "Super admin all attendance_records" ON public.attendance_records;
CREATE POLICY "Staff manage attendance_records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())))
  WITH CHECK (is_super_admin(auth.uid()) OR (tenant_id = current_tenant_id() AND is_tenant_staff(auth.uid())));
CREATE POLICY "Student reads own attendance" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (student_id = current_student_id());