REVOKE EXECUTE ON FUNCTION public.is_tenant_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_student_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.student_in_class(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.student_in_class(uuid) TO authenticated;