
-- 1. Include 'coordenador' in is_tenant_staff so ele possa gerir alunos/turmas
CREATE OR REPLACE FUNCTION public.is_tenant_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin','admin_instituicao','coordenador','professor')
  )
$function$;

-- 2. Policies do bucket 'submissions': aluno faz upload da própria entrega; staff do tenant lê tudo
DROP POLICY IF EXISTS "submissions_read_owner_or_staff" ON storage.objects;
CREATE POLICY "submissions_read_owner_or_staff"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions'
  AND (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid()
        AND s.id::text = split_part(name, '/', 1)
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('super_admin','admin_instituicao','coordenador','professor')
        AND ur.tenant_id::text = split_part(name, '/', 2)
    )
  )
);

DROP POLICY IF EXISTS "submissions_insert_owner" ON storage.objects;
CREATE POLICY "submissions_insert_owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id::text = split_part(name, '/', 1)
  )
);

DROP POLICY IF EXISTS "submissions_delete_owner" ON storage.objects;
CREATE POLICY "submissions_delete_owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id::text = split_part(name, '/', 1)
  )
);

-- 3. Tabela de metadados dos arquivos anexados a uma submission
CREATE TABLE public.submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_files TO authenticated;
GRANT ALL ON public.submission_files TO service_role;

ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submission_files_select"
ON public.submission_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = submission_files.student_id AND s.user_id = auth.uid()
  )
  OR public.is_tenant_staff(auth.uid())
);

CREATE POLICY "submission_files_insert_own"
ON public.submission_files FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = submission_files.student_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "submission_files_delete_own"
ON public.submission_files FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = submission_files.student_id AND s.user_id = auth.uid()
  )
);

CREATE INDEX submission_files_submission_idx ON public.submission_files(submission_id);
CREATE INDEX submission_files_student_idx ON public.submission_files(student_id);
