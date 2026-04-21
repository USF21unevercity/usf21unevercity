
-- 1) Activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college text NOT NULL,
  level text,
  specialty text,
  activity_type text,
  title text NOT NULL,
  description text,
  image_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view activities" ON public.activities
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin manages activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "College admin manages own college activities" ON public.activities
  FOR ALL TO authenticated
  USING (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid()))
  WITH CHECK (public.is_college_admin(auth.uid()) AND college = public.get_admin_college(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_activities_college ON public.activities(college);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- 2) Public storage bucket for activity images
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read activity images" ON storage.objects
  FOR SELECT USING (bucket_id = 'activities');

CREATE POLICY "Anyone can upload activity images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'activities');

CREATE POLICY "Anyone can delete activity images" ON storage.objects
  FOR DELETE USING (bucket_id = 'activities');

-- 3) Replace members_public view: show male phones, hide female phones
DROP VIEW IF EXISTS public.members_public;
CREATE VIEW public.members_public
WITH (security_invoker = true)
AS
SELECT
  id,
  full_name,
  college,
  level,
  specialty,
  gender,
  committee_role,
  join_year,
  CASE WHEN gender = 'male' THEN phone ELSE NULL END AS phone,
  created_at
FROM public.members;

GRANT SELECT ON public.members_public TO anon, authenticated;

-- 4) Performance indexes for exam load
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_normname
  ON public.exam_attempts(exam_id, student_name_normalized);
CREATE INDEX IF NOT EXISTS idx_exams_access_code ON public.exams(access_code);
