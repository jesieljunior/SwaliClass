ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS max_grade numeric(6,2) NOT NULL DEFAULT 10;
ALTER TABLE public.activities ADD CONSTRAINT activities_max_grade_positive CHECK (max_grade > 0);