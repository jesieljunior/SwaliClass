DROP TRIGGER IF EXISTS attendance_sessions_set_updated_at ON public.attendance_sessions;
CREATE TRIGGER attendance_sessions_set_updated_at
BEFORE UPDATE ON public.attendance_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();