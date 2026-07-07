ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aluno';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS students_user_id_key ON public.students(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(lower(email));