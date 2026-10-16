ALTER TABLE public.profiles ADD COLUMN blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN member_id text UNIQUE DEFAULT ('SM13-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6)));
UPDATE public.profiles SET member_id = 'SM13-' || upper(substr(md5(random()::text || id::text),1,6)) WHERE member_id IS NULL;

CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'approved' AND NOT blocked)
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.role := OLD.role; NEW.status := OLD.status; NEW.blocked := OLD.blocked; NEW.member_id := OLD.member_id;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER profiles_protect BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

CREATE TABLE public.recovery_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.recovery_requests TO authenticated;
GRANT ALL ON public.recovery_requests TO service_role;
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY rr_insert_own ON public.recovery_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY rr_select ON public.recovery_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY rr_delete_admin ON public.recovery_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caption text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY news_select ON public.news FOR SELECT TO authenticated USING (public.is_approved(auth.uid()));
CREATE POLICY news_insert ON public.news FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.is_approved(auth.uid()));
CREATE POLICY news_delete ON public.news FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));