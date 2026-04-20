-- جدول الاختبارات
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  college TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  access_code TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active exams"
ON public.exams FOR SELECT
USING (is_active = true);

CREATE POLICY "Admin manages exams"
ON public.exams FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "College admin manages own college exams"
ON public.exams FOR ALL
TO authenticated
USING (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid()))
WITH CHECK (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid()));

-- جدول محاولات الطلاب
CREATE TABLE public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  college TEXT
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit attempt"
ON public.exam_attempts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update own attempt by id"
ON public.exam_attempts FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin views attempts"
ON public.exam_attempts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "College admin views own college attempts"
ON public.exam_attempts FOR SELECT
TO authenticated
USING (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid()));

CREATE POLICY "Admin deletes attempts"
ON public.exam_attempts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid())));

CREATE INDEX idx_exam_attempts_exam ON public.exam_attempts(exam_id);
CREATE INDEX idx_exams_college ON public.exams(college);