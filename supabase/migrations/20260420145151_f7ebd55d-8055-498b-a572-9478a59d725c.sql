-- Add feedback and normalized name to exam_attempts
ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS student_name_normalized text;

-- Trigger to auto-fill normalized name
CREATE OR REPLACE FUNCTION public.set_attempt_normalized_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.student_name_normalized := trim(public.normalize_arabic_name(NEW.student_name));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_attempt_normalize ON public.exam_attempts;
CREATE TRIGGER trg_attempt_normalize
BEFORE INSERT OR UPDATE ON public.exam_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_attempt_normalized_name();

CREATE INDEX IF NOT EXISTS idx_attempts_exam_name ON public.exam_attempts(exam_id, student_name_normalized);

-- Channels table (managed by admin, public read)
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name text NOT NULL,
  channel_url text NOT NULL,
  college text NOT NULL,
  level text,
  specialty text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view channels"
  ON public.channels FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin manages channels"
  ON public.channels FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "College admin manages own college channels"
  ON public.channels FOR ALL
  TO authenticated
  USING (is_college_admin(auth.uid()) AND college = get_admin_college(auth.uid()))
  WITH CHECK (is_college_admin(auth.uid()) AND college = get_admin_college(auth.uid()));