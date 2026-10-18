-- Grades (nilai siswa)
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Approved users may read: admins/guru read all, siswa read their own
CREATE POLICY "grades_select" ON public.grades
FOR SELECT TO authenticated
USING (
  public.is_approved(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'guru')
    OR student_id = auth.uid()
  )
);

-- Only admin may write
CREATE POLICY "grades_admin_insert" ON public.grades
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "grades_admin_update" ON public.grades
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "grades_admin_delete" ON public.grades
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER grades_touch_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();