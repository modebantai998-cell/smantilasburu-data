ALTER TABLE public.stories ADD COLUMN media_type text NOT NULL DEFAULT 'image';

CREATE TABLE public.profile_likes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, user_id)
);
CREATE INDEX profile_likes_profile_idx ON public.profile_likes(profile_id);

CREATE TABLE public.profile_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX profile_comments_profile_idx ON public.profile_comments(profile_id);

GRANT SELECT, INSERT, DELETE ON public.profile_likes TO authenticated;
GRANT ALL ON public.profile_likes TO service_role;
GRANT SELECT, INSERT, DELETE ON public.profile_comments TO authenticated;
GRANT ALL ON public.profile_comments TO service_role;

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY profile_likes_select ON public.profile_likes
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY profile_likes_insert ON public.profile_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_approved(auth.uid()));
CREATE POLICY profile_likes_delete ON public.profile_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY profile_comments_select ON public.profile_comments
  FOR SELECT TO authenticated USING (is_approved(auth.uid()));
CREATE POLICY profile_comments_insert ON public.profile_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_approved(auth.uid()) AND char_length(trim(body)) BETWEEN 1 AND 500);
CREATE POLICY profile_comments_delete ON public.profile_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_comments;