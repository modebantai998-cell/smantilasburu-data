CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX stories_expires_idx ON public.stories (expires_at);
CREATE INDEX stories_user_idx ON public.stories (user_id);

GRANT SELECT, INSERT, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY stories_select_active ON public.stories
  FOR SELECT TO authenticated
  USING (is_approved(auth.uid()) AND expires_at > now());

CREATE POLICY stories_insert_own ON public.stories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_approved(auth.uid()));

CREATE POLICY stories_delete_own ON public.stories
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX direct_messages_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at);
CREATE INDEX direct_messages_recipient_idx ON public.direct_messages (recipient_id, read_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY dm_select_participants ON public.direct_messages
  FOR SELECT TO authenticated
  USING ((sender_id = auth.uid() OR recipient_id = auth.uid()) AND is_approved(auth.uid()));

CREATE POLICY dm_insert_sender ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND recipient_id <> auth.uid() AND is_approved(auth.uid()));

CREATE POLICY dm_update_mark_read ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE POLICY dm_delete_sender ON public.direct_messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;