REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_approved(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_class() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_class() TO authenticated, service_role;